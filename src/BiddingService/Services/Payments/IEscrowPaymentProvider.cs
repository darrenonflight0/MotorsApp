using BiddingService.Models;

namespace BiddingService.Services.Payments;

/// <summary>
/// Abstraction over the money movement behind an escrow. The escrow state
/// machine (deposit → release / refund) is provider-agnostic; a concrete
/// provider actually captures, pays out, or refunds funds. This lets the
/// platform run on a simulated provider in development and a real payment
/// processor (e.g. Stripe) in production without changing the escrow logic.
/// </summary>
public interface IEscrowPaymentProvider
{
    /// <summary>Human-readable provider name, surfaced in audit logs.</summary>
    string Name { get; }

    /// <summary>True when real funds move. False for the development simulation.</summary>
    bool HandlesRealFunds { get; }

    /// <summary>Capture the buyer's deposit into escrow custody.</summary>
    Task<PaymentResult> CaptureDepositAsync(Escrow escrow, string paymentReference, CancellationToken ct = default);

    /// <summary>Release held funds to the seller.</summary>
    Task<PaymentResult> ReleaseToSellerAsync(Escrow escrow, CancellationToken ct = default);

    /// <summary>Refund held funds to the buyer.</summary>
    Task<PaymentResult> RefundBuyerAsync(Escrow escrow, CancellationToken ct = default);
}

/// <summary>Outcome of a payment operation.</summary>
public record PaymentResult(bool Success, string ProviderReference, string Message)
{
    public static PaymentResult Ok(string reference, string message = "ok") => new(true, reference, message);
    public static PaymentResult Fail(string message) => new(false, null, message);
}
