using BiddingService.Models;

namespace BiddingService.Services.Payments;

/// <summary>
/// Development / demo provider. No real money moves — it records the intended
/// transitions and always succeeds. Its <see cref="HandlesRealFunds"/> is false
/// so the rest of the system (and any UI) can clearly signal that funds are
/// simulated. Never select this provider in production.
/// </summary>
public class SimulatedEscrowPaymentProvider : IEscrowPaymentProvider
{
    private readonly ILogger<SimulatedEscrowPaymentProvider> _logger;

    public SimulatedEscrowPaymentProvider(ILogger<SimulatedEscrowPaymentProvider> logger)
    {
        _logger = logger;
    }

    public string Name => "Simulated";
    public bool HandlesRealFunds => false;

    public Task<PaymentResult> CaptureDepositAsync(Escrow escrow, string paymentReference, CancellationToken ct = default)
    {
        _logger.LogInformation("PAYMENT simulated_capture auction={Auction} amount={Amount}", escrow.AuctionId, escrow.Amount);
        return Task.FromResult(PaymentResult.Ok($"sim_dep_{Guid.NewGuid():N}", "simulated deposit captured"));
    }

    public Task<PaymentResult> ReleaseToSellerAsync(Escrow escrow, CancellationToken ct = default)
    {
        _logger.LogInformation("PAYMENT simulated_release auction={Auction} seller={Seller} amount={Amount}", escrow.AuctionId, escrow.Seller, escrow.Amount);
        return Task.FromResult(PaymentResult.Ok($"sim_rel_{Guid.NewGuid():N}", "simulated release to seller"));
    }

    public Task<PaymentResult> RefundBuyerAsync(Escrow escrow, CancellationToken ct = default)
    {
        _logger.LogInformation("PAYMENT simulated_refund auction={Auction} buyer={Buyer} amount={Amount}", escrow.AuctionId, escrow.Buyer, escrow.Amount);
        return Task.FromResult(PaymentResult.Ok($"sim_ref_{Guid.NewGuid():N}", "simulated refund to buyer"));
    }
}
