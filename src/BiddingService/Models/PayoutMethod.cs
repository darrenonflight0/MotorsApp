using MongoDB.Entities;

namespace BiddingService.Models;

/// <summary>
/// A seller's payout destination — the connected account / transfer recipient
/// held funds are released to when an escrow settles. One per seller (keyed by
/// username). The sensitive account number is never stored: only the provider's
/// recipient handle plus a masked display are kept, so nothing here can be used
/// to move money on its own.
/// </summary>
public class PayoutMethod : Entity
{
    public string Seller { get; set; }               // username (unique)
    public string Provider { get; set; }             // "Paystack" | "Stripe" | "Simulated"
    public string RecipientCode { get; set; }        // provider recipient / connected-account handle
    public string BankName { get; set; }
    public string AccountName { get; set; }
    public string AccountLast4 { get; set; }
    public string Currency { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
