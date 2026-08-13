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

    /// <summary>
    /// Banks the seller can be paid out to, for the given settlement currency.
    /// Empty when the provider onboards payouts a different way (e.g. Stripe
    /// Connect hosted onboarding).
    /// </summary>
    Task<IReadOnlyList<PayoutBank>> ListPayoutBanksAsync(string currency, CancellationToken ct = default);

    /// <summary>
    /// Register a seller's bank account as a payout destination, returning the
    /// provider handle (transfer-recipient / connected-account id) that
    /// <see cref="ReleaseToSellerAsync"/> later pays into.
    /// </summary>
    Task<RecipientResult> CreatePayoutRecipientAsync(PayoutRecipientRequest request, CancellationToken ct = default);
}

/// <summary>A bank a seller can select when registering a payout destination.</summary>
public record PayoutBank(string Name, string Code);

/// <summary>Details a seller supplies to register a payout destination.</summary>
public record PayoutRecipientRequest(string BankCode, string AccountNumber, string AccountName, string Currency);

/// <summary>Outcome of registering a payout destination.</summary>
public record RecipientResult(bool Success, string RecipientCode, string BankName, string AccountLast4, string Message)
{
    public static RecipientResult Ok(string code, string bankName, string last4) =>
        new(true, code, bankName, last4, "ok");
    public static RecipientResult Fail(string message) => new(false, null, null, null, message);
}

/// <summary>Outcome of a payment operation.</summary>
public record PaymentResult(bool Success, string ProviderReference, string Message)
{
    public static PaymentResult Ok(string reference, string message = "ok") => new(true, reference, message);
    public static PaymentResult Fail(string message) => new(false, null, message);
}
