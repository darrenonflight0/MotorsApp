using BiddingService.Models;
using MongoDB.Entities;

namespace BiddingService.Services;

/// <summary>
/// Enforces the escrow funding deadline. A winner who never funds their escrow
/// can't be allowed to tie up the lot indefinitely, so after
/// <c>BidDeposit:FundingWindowHours</c> (default 48h) an unfunded escrow is
/// marked Defaulted and the winner's refundable bid deposit is forfeited —
/// making a winning-then-ghosting bid cost real money with no admin action.
/// Set the window to 0 to disable the sweep.
/// </summary>
public class CheckEscrowFundingTimeout : BackgroundService
{
    private static readonly TimeSpan SweepInterval = TimeSpan.FromMinutes(1);

    private readonly ILogger<CheckEscrowFundingTimeout> _logger;
    private readonly IConfiguration _config;

    public CheckEscrowFundingTimeout(ILogger<CheckEscrowFundingTimeout> logger, IConfiguration config)
    {
        _logger = logger;
        _config = config;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SweepExpired(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Escrow funding-timeout sweep failed");
            }

            await Task.Delay(SweepInterval, stoppingToken);
        }
    }

    private async Task SweepExpired(CancellationToken ct)
    {
        var windowHours = _config.GetValue("BidDeposit:FundingWindowHours", 48);
        if (windowHours <= 0) return; // disabled

        var cutoff = DateTime.UtcNow.AddHours(-windowHours);
        var expired = await DB.Find<Escrow>()
            .Match(e => e.Status == EscrowStatus.AwaitingDeposit && e.CreatedAt < cutoff)
            .ExecuteAsync(ct);
        if (expired.Count == 0) return;

        foreach (var escrow in expired)
        {
            var deposit = await DB.Find<BidDeposit>()
                .Match(d => d.AuctionId == escrow.AuctionId && d.Bidder == escrow.Buyer
                    && d.Status == BidDepositStatus.Held)
                .ExecuteFirstAsync(ct);

            if (deposit != null)
            {
                deposit.Status = BidDepositStatus.Forfeited;
                deposit.ClosedAt = DateTime.UtcNow;
                await DB.SaveAsync(deposit, null, ct);
                _logger.LogWarning(
                    "SECURITY bid_deposit_forfeited_timeout auction={Auction} bidder={Bidder} amount={Amount}",
                    escrow.AuctionId, escrow.Buyer, deposit.Amount);
            }

            escrow.Status = EscrowStatus.Defaulted;
            escrow.ClosedAt = DateTime.UtcNow;
            escrow.Audit("system",
                $"buyer did not fund within {windowHours}h; sale defaulted"
                + (deposit != null ? "; bid deposit forfeited" : ""));
            await DB.SaveAsync(escrow, null, ct);
            _logger.LogWarning("SECURITY escrow_defaulted auction={Auction} buyer={Buyer} windowHours={Window}",
                escrow.AuctionId, escrow.Buyer, windowHours);
        }
    }
}
