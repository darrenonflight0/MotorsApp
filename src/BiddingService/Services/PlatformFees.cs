using Microsoft.Extensions.Configuration;

namespace BiddingService.Services;

/// <summary>
/// Platform monetisation. A buyer's premium is added on top of the winning bid
/// at checkout: the buyer pays bid + premium, the seller still receives the bid,
/// and the platform keeps the premium. The rate is configurable via
/// <c>Payments:BuyerPremiumPercent</c> and defaults to 7%.
/// </summary>
public static class PlatformFees
{
    public const int DefaultBuyerPremiumPercent = 7;

    public static int BuyerPremiumPercent(IConfiguration config) =>
        config.GetValue("Payments:BuyerPremiumPercent", DefaultBuyerPremiumPercent);

    /// <summary>The premium amount (whole currency units) for a given bid.</summary>
    public static int Premium(int amount, int percent) =>
        (int)Math.Round(amount * percent / 100.0, MidpointRounding.AwayFromZero);

    /// <summary>What the buyer actually pays: bid + premium.</summary>
    public static int Total(int amount, int percent) => amount + Premium(amount, percent);
}
