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

        // 1. An explicitly configured key (env var or file) takes precedence — but
        //    a malformed value must NEVER take the whole bidding service down. A
        //    bad PEM here used to throw and 500 every bid endpoint; instead we log
        //    it and fall through to the persisted key below.
        var inlinePem = config["BidLedger:KeyPem"];
        var keyPath = config["BidLedger:KeyPath"] ?? "bid-ledger-rsa.pem";

        if (!string.IsNullOrWhiteSpace(inlinePem))
        {
            // Accept both multi-line PEM and single-line with literal "\n" escapes
            // (some hosts mangle multi-line env vars).
            if (TryImport(inlinePem.Replace("\\n", "\n").Trim(), "config", logger)) return;
        }
        else if (File.Exists(keyPath))
        {
            if (TryImport(File.ReadAllText(keyPath), $"path {keyPath}", logger)) return;
        }

        // 2. Persisted key in the BiddingService's Mongo database: stable across
        //    redeploys and restarts with nothing to hand-carry. Generated once and
        //    reused thereafter so signatures stay verifiable over time.
        var stored = DB.Find<LedgerKey>()
            .Match(f => f.Empty)
            .ExecuteFirstAsync().GetAwaiter().GetResult();
        if (stored != null && !string.IsNullOrWhiteSpace(stored.PrivateKeyPem)
            && TryImport(stored.PrivateKeyPem, "mongo", logger))
        {
            return;
        }

        // 3. First run anywhere with no usable key: generate one and persist it so
        //    every later start reuses it.
        var generatedPem = _rsa.ExportPkcs8PrivateKeyPem();
        DB.SaveAsync(new LedgerKey { PrivateKeyPem = generatedPem }).GetAwaiter().GetResult();
        logger.LogWarning("SECURITY bid_ledger_key_generated source=mongo");
    }

    // Import a PEM into _rsa; returns false (and logs) instead of throwing so the
    // caller can fall back to another key source rather than crashing requests.
    private bool TryImport(string pem, string source, ILogger<BidLedger> logger)
    {
        try
        {
            _rsa.ImportFromPem(pem);
            logger.LogInformation("SECURITY bid_ledger_key_loaded source={Source}", source);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SECURITY bid_ledger_key_invalid source={Source}; falling back", source);
            return false;
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
