using System.Security.Cryptography;
using System.Text;
using BiddingService.Models;
using MongoDB.Entities;

namespace BiddingService.Services;

/// <summary>
/// Tamper-evident bid ledger.
/// Every bid is chained to the previous bid on the same auction with SHA-256,
/// and the chain entry is signed with the platform's RSA-2048 key so neither a
/// database operator nor an API caller can silently rewrite bid history.
/// </summary>
public class BidLedger
{
    private readonly RSA _rsa;

    public BidLedger(IConfiguration config, IHostEnvironment env, ILogger<BidLedger> logger)
    {
        _rsa = RSA.Create(2048);

        // Key material may be injected directly (BidLedger:KeyPem — ideal for
        // container secrets / key vaults) or loaded from a file path. Auto-
        // generating a throwaway key is a development-only convenience: in
        // production every instance would otherwise sign with a different key,
        // making signatures unverifiable across the fleet and after a restart.
        var inlinePem = config["BidLedger:KeyPem"];
        var keyPath = config["BidLedger:KeyPath"] ?? "bid-ledger-rsa.pem";

        if (!string.IsNullOrWhiteSpace(inlinePem))
        {
            // Some hosts (Railway, Heroku, etc.) can't hold multi-line env vars,
            // so accept a single-line PEM with literal "\n" escapes too.
            _rsa.ImportFromPem(inlinePem.Replace("\\n", "\n"));
            logger.LogInformation("SECURITY bid_ledger_key_loaded source=config");
        }
        else if (File.Exists(keyPath))
        {
            _rsa.ImportFromPem(File.ReadAllText(keyPath));
            logger.LogInformation("SECURITY bid_ledger_key_loaded path={Path}", keyPath);
        }
        else if (env.IsDevelopment())
        {
            File.WriteAllText(keyPath, _rsa.ExportRSAPrivateKeyPem());
            logger.LogWarning("SECURITY bid_ledger_key_generated path={Path}", keyPath);
        }
        else
        {
            throw new InvalidOperationException(
                "No bid-ledger signing key configured (set BidLedger:KeyPem or BidLedger:KeyPath). " +
                "Refusing to start in production with an ephemeral per-instance key.");
        }
    }

    public string PublicKeyPem => _rsa.ExportSubjectPublicKeyInfoPem();

    /// <summary>
    /// Canonical payload the hash commits to. BidTime is truncated to
    /// millisecond precision because MongoDB stores DateTime as int64 ms;
    /// higher precision would break verification after a round-trip.
    /// </summary>
    private static string Canonical(Bid bid, string previousHash) =>
        $"{bid.AuctionId}|{bid.Bidder}|{bid.Amount}|{bid.BidTime.ToUniversalTime():yyyy-MM-ddTHH:mm:ss.fffZ}|{bid.BidStatus}|{previousHash ?? "GENESIS"}";

    public void Seal(Bid bid, Bid previous)
    {
        bid.PreviousBidHash = previous?.BidHash;
        bid.BidHash = Hash(Canonical(bid, bid.PreviousBidHash));
        bid.Signature = Convert.ToBase64String(
            _rsa.SignData(Encoding.UTF8.GetBytes(bid.BidHash),
                HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1));
    }

    public bool VerifySignature(Bid bid)
    {
        if (string.IsNullOrEmpty(bid.BidHash) || string.IsNullOrEmpty(bid.Signature)) return false;
        return _rsa.VerifyData(Encoding.UTF8.GetBytes(bid.BidHash),
            Convert.FromBase64String(bid.Signature),
            HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
    }

    /// <summary>
    /// Re-walks an auction's chain oldest-to-newest and checks every link.
    /// Bids placed before the ledger existed (no hash) are tolerated only as a
    /// prefix; an unsealed bid after a sealed one indicates tampering.
    /// </summary>
    public async Task<(bool valid, int sealedCount, int legacyCount, string brokenAt)> VerifyChain(
        string auctionId)
    {
        var bids = await DB.Find<Bid>()
            .Match(b => b.AuctionId == auctionId)
            .Sort(b => b.Ascending(x => x.BidTime))
            .ExecuteAsync();

        string previousHash = null;
        var sealedSeen = 0;
        var legacySeen = 0;

        foreach (var bid in bids)
        {
            if (string.IsNullOrEmpty(bid.BidHash))
            {
                // Pre-ledger bid: acceptable only before any sealed bid.
                if (sealedSeen > 0) return (false, sealedSeen, legacySeen, bid.ID);
                legacySeen++;
                continue;
            }

            var expectedHash = Hash(Canonical(bid, previousHash));
            if (bid.PreviousBidHash != previousHash
                || bid.BidHash != expectedHash
                || !VerifySignature(bid))
            {
                return (false, sealedSeen, legacySeen, bid.ID);
            }
            previousHash = bid.BidHash;
            sealedSeen++;
        }

        return (true, sealedSeen, legacySeen, null);
    }

    private static string Hash(string payload)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(payload)));
    }
}
