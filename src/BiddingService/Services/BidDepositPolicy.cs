using Microsoft.Extensions.Configuration;

namespace BiddingService.Services;

/// <summary>
/// How large a refundable bid deposit an auction requires. The deposit is a
/// percentage of the lot's reserve price, clamped to a floor and ceiling, so
/// cheap lots still need a meaningful deposit and expensive lots don't demand an
/// unreasonable one. All values are configurable under <c>BidDeposit:*</c>.
/// </summary>
public static class BidDepositPolicy
{
    public const int DefaultPercent = 10;
    public const int DefaultMinAmount = 20;
    public const int DefaultMaxAmount = 500;

    public static bool Enabled(IConfiguration config) =>
        config.GetValue("BidDeposit:Enabled", true);

    public static int Percent(IConfiguration config) =>
        config.GetValue("BidDeposit:Percent", DefaultPercent);

    public static int MinAmount(IConfiguration config) =>
        config.GetValue("BidDeposit:MinAmount", DefaultMinAmount);

    public static int MaxAmount(IConfiguration config) =>
        config.GetValue("BidDeposit:MaxAmount", DefaultMaxAmount);

    /// <summary>The deposit (whole currency units) required to bid on this lot.</summary>
    public static int RequiredAmount(IConfiguration config, int reservePrice)
    {
        var min = MinAmount(config);
        var max = Math.Max(min, MaxAmount(config));
        var raw = (int)Math.Round(Math.Max(0, reservePrice) * Percent(config) / 100.0,
            MidpointRounding.AwayFromZero);
        return Math.Clamp(raw, min, max);
    }
}
