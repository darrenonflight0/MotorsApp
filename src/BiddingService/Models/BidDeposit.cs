using MongoDB.Entities;

namespace BiddingService.Models;

public enum BidDepositStatus
{
    Held,       // paid and qualifying the bidder for this auction
    Refunded,   // returned (bidder lost, or winner funded escrow)
    Forfeited,  // kept as a penalty (winner defaulted)
}

/// <summary>
/// A refundable deposit a bidder puts down to be allowed to bid on an auction.
/// It deters bidders who have no intention (or means) to pay: real money is held
/// up front, returned when the bidder loses or when the winner funds the escrow,
/// and forfeitable if the winner ghosts. One active (Held) deposit per
/// bidder+auction qualifies that bidder to place bids on the lot.
/// </summary>
public class BidDeposit : Entity
{
    public string AuctionId { get; set; }
    public string Bidder { get; set; }
    public int Amount { get; set; }
    public string Currency { get; set; }
    public BidDepositStatus Status { get; set; } = BidDepositStatus.Held;

    public string PaymentProvider { get; set; }   // "Simulated" | "Paystack" | ...
    public string PaymentReference { get; set; }   // captured deposit id (for refunds)
    public string RefundReference { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
}
