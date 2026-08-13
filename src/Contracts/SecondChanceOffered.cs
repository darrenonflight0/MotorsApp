namespace Contracts;

/// <summary>
/// Raised when a defaulted lot is offered to the next-highest eligible bidder.
/// The NotificationService turns this into a real-time alert for the new buyer.
/// </summary>
public class SecondChanceOffered
{
    public string AuctionId { get; set; }
    public string Buyer { get; set; }
    public string Seller { get; set; }
    public int Amount { get; set; }
}
