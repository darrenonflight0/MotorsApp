namespace Contracts;

/// <summary>
/// Raised when a defaulted lot (winner never funded, no eligible next bidder) is
/// put back up for sale: the auction reopens Live with a fresh end time and its
/// winner/sold state cleared.
/// </summary>
public class AuctionRelisted
{
    public string AuctionId { get; set; }
    public DateTime NewAuctionEnd { get; set; }
}
