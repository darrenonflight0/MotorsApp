using BiddingService.Models;
using BiddingService.Services.Payments;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Yamkela.UnitTests;

/// <summary>
/// Tests the Paystack provider's construction and pre-flight guard clauses.
/// These paths never reach the network, so they run without a live Paystack.
/// </summary>
public class PaystackProviderTests
{
    private static PaystackEscrowPaymentProvider NewProvider() =>
        new(new HttpClient(),
            new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string>
                {
                    ["Payments:Paystack:SecretKey"] = "sk_test_dummy",
                    ["Payments:Paystack:Currency"] = "GHS",
                }).Build(),
            NullLogger<PaystackEscrowPaymentProvider>.Instance);

    private static Escrow Escrow() => new() { AuctionId = "a1", Buyer = "bob", Seller = "alice", Amount = 5000 };

    [Fact]
    public void HandlesRealFunds_AndIsNamedPaystack()
    {
        var provider = NewProvider();
        Assert.True(provider.HandlesRealFunds);
        Assert.Equal("Paystack", provider.Name);
    }

    [Fact]
    public void Constructor_ThrowsWhenSecretKeyMissing()
    {
        var emptyConfig = new ConfigurationBuilder().Build();
        Assert.Throws<InvalidOperationException>(() =>
            new PaystackEscrowPaymentProvider(new HttpClient(), emptyConfig, NullLogger<PaystackEscrowPaymentProvider>.Instance));
    }

    [Fact]
    public async Task CaptureDeposit_WithoutReference_FailsWithoutCallingNetwork()
    {
        var result = await NewProvider().CaptureDepositAsync(Escrow(), paymentReference: null);
        Assert.False(result.Success);
    }

    [Fact]
    public async Task Release_WithoutRecipient_Fails()
    {
        var result = await NewProvider().ReleaseToSellerAsync(Escrow()); // SellerPayoutAccount null
        Assert.False(result.Success);
    }

    [Fact]
    public async Task Refund_WithoutDeposit_Fails()
    {
        var result = await NewProvider().RefundBuyerAsync(Escrow()); // DepositReference null
        Assert.False(result.Success);
    }
}
