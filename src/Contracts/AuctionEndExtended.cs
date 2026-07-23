namespace Contracts;

/// <summary>
/// Anti-sniping: raised when a late bid pushes the auction end time out.
/// </summary>
public class AuctionEndExtended
{
    public string AuctionId { get; set; }
    public DateTime NewAuctionEnd { get; set; }
}
