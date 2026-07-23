using MongoDB.Entities;

namespace BiddingService.Models;

public class Bid : Entity
{
    public string AuctionId { get; set; }
    public DateTime BidTime { get; set; } = DateTime.UtcNow;
    public string Bidder { get; set; }
    public int Amount { get; set; }
    public BidStatus BidStatus { get; set; }

    // Tamper-evident ledger fields (see Services/BidLedger).
    public string PreviousBidHash { get; set; }
    public string BidHash { get; set; }
    public string Signature { get; set; }
}
