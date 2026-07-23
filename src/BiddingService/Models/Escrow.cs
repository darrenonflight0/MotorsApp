using MongoDB.Entities;

namespace BiddingService.Models;

public enum EscrowStatus
{
    AwaitingDeposit,
    Funded,
    Released,
    Refunded,
    Disputed,
}

/// <summary>
/// Escrow record for a sold auction. Funds are held by the platform
/// (simulated in development) until the buyer confirms delivery or an
/// admin resolves a dispute. State can only move forward:
/// AwaitingDeposit → Funded → (Released | Refunded | Disputed),
/// Disputed → (Released | Refunded) by admins only.
/// </summary>
public class Escrow : Entity
{
    public string AuctionId { get; set; }
    public string Seller { get; set; }
    public string Buyer { get; set; }
    public int Amount { get; set; }
    public EscrowStatus Status { get; set; } = EscrowStatus.AwaitingDeposit;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FundedAt { get; set; }
    public DateTime? ClosedAt { get; set; }

    public List<string> AuditTrail { get; set; } = new();

    public void Audit(string actor, string action)
    {
        AuditTrail.Add($"{DateTime.UtcNow:O}|{actor}|{action}");
    }
}
