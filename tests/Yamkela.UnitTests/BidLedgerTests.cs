using System.Security.Cryptography;
using BiddingService.Models;
using BiddingService.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Yamkela.UnitTests;

/// <summary>
/// Unit tests for the tamper-evident bid ledger — the platform's core integrity
/// guarantee. The ledger is constructed with an injected RSA key so the tests
/// are deterministic and touch no disk or database.
/// </summary>
public class BidLedgerTests
{
    private static BidLedger NewLedger()
    {
        using var rsa = RSA.Create(2048);
        var pem = rsa.ExportRSAPrivateKeyPem();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string> { ["BidLedger:KeyPem"] = pem })
            .Build();

        return new BidLedger(config, new StubEnv(), NullLogger<BidLedger>.Instance);
    }

    private static Bid Bid(string auction, string bidder, int amount) => new()
    {
        AuctionId = auction,
        Bidder = bidder,
        Amount = amount,
        BidTime = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc),
        BidStatus = BidStatus.Accepted,
    };

    [Fact]
    public void Seal_GenesisBid_HasNoPreviousHashAndValidSignature()
    {
        var ledger = NewLedger();
        var bid = Bid("auction-1", "alice", 1000);

        ledger.Seal(bid, previous: null);

        Assert.Null(bid.PreviousBidHash);
        Assert.False(string.IsNullOrEmpty(bid.BidHash));
        Assert.False(string.IsNullOrEmpty(bid.Signature));
        Assert.True(ledger.VerifySignature(bid));
    }

    [Fact]
    public void Seal_ChainsEachBidToItsPredecessor()
    {
        var ledger = NewLedger();
        var first = Bid("auction-1", "alice", 1000);
        var second = Bid("auction-1", "bob", 1500);

        ledger.Seal(first, null);
        ledger.Seal(second, first);

        Assert.Equal(first.BidHash, second.PreviousBidHash);
        Assert.True(ledger.VerifySignature(second));
    }

    [Fact]
    public void VerifySignature_FailsWhenSignatureCorrupted()
    {
        var ledger = NewLedger();
        var bid = Bid("auction-1", "alice", 1000);
        ledger.Seal(bid, null);

        // Flip the leading character of the signature.
        bid.Signature = (bid.Signature[0] == 'A' ? 'B' : 'A') + bid.Signature[1..];

        Assert.False(ledger.VerifySignature(bid));
    }

    [Fact]
    public void VerifySignature_FailsWhenSealedHashAltered()
    {
        var ledger = NewLedger();
        var bid = Bid("auction-1", "alice", 1000);
        ledger.Seal(bid, null);

        // An attacker who rewrites the hash but cannot re-sign it is detected.
        bid.BidHash = new string('0', bid.BidHash.Length);

        Assert.False(ledger.VerifySignature(bid));
    }

    [Fact]
    public void Seal_IsDeterministicForIdenticalInput()
    {
        var ledger = NewLedger();
        var a = Bid("auction-1", "alice", 1000);
        var b = Bid("auction-1", "alice", 1000);

        ledger.Seal(a, null);
        ledger.Seal(b, null);

        Assert.Equal(a.BidHash, b.BidHash);
        Assert.Equal(a.Signature, b.Signature);
    }

    [Fact]
    public void Seal_DifferentAmountsProduceDifferentHashes()
    {
        var ledger = NewLedger();
        var a = Bid("auction-1", "alice", 1000);
        var b = Bid("auction-1", "alice", 2000);

        ledger.Seal(a, null);
        ledger.Seal(b, null);

        Assert.NotEqual(a.BidHash, b.BidHash);
    }

    [Fact]
    public void VerifySignature_FailsForUnsealedBid()
    {
        var ledger = NewLedger();
        Assert.False(ledger.VerifySignature(Bid("auction-1", "alice", 1000)));
    }

    // Minimal IHostEnvironment stub (Development) for the ledger constructor.
    private sealed class StubEnv : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "Tests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; }
    }
}
