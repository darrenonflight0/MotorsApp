using BiddingService.Models;
using BiddingService.Services.Payments;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Yamkela.UnitTests;

public class PaymentProviderTests
{
    private static Escrow SampleEscrow() => new()
    {
        AuctionId = "auction-1",
        Buyer = "bob",
        Seller = "alice",
        Amount = 5000,
    };

    [Fact]
    public void Simulated_DoesNotHandleRealFunds()
    {
        var provider = new SimulatedEscrowPaymentProvider(NullLogger<SimulatedEscrowPaymentProvider>.Instance);
        Assert.False(provider.HandlesRealFunds);
        Assert.Equal("Simulated", provider.Name);
    }

    [Fact]
    public async Task Simulated_CaptureReleaseRefund_AllSucceedWithReference()
    {
        var provider = new SimulatedEscrowPaymentProvider(NullLogger<SimulatedEscrowPaymentProvider>.Instance);
        var escrow = SampleEscrow();

        var deposit = await provider.CaptureDepositAsync(escrow, paymentReference: null);
        var release = await provider.ReleaseToSellerAsync(escrow);
        var refund = await provider.RefundBuyerAsync(escrow);

        Assert.True(deposit.Success);
        Assert.True(release.Success);
        Assert.True(refund.Success);
        Assert.False(string.IsNullOrEmpty(deposit.ProviderReference));
    }

    [Fact]
    public void PaymentResult_FactoryHelpers_SetSuccessFlag()
    {
        Assert.True(PaymentResult.Ok("ref-1").Success);
        Assert.False(PaymentResult.Fail("nope").Success);
        Assert.Null(PaymentResult.Fail("nope").ProviderReference);
    }
}
