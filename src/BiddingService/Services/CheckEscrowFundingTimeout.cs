using BiddingService.Models;
using Contracts;
using MassTransit;
using MongoDB.Entities;

namespace BiddingService.Services;

/// <summary>
/// Enforces the escrow funding deadline and recovers the lot. After
/// <c>BidDeposit:FundingWindowHours</c> (default 48h) an unfunded escrow is marked
/// Defaulted and the winner's refundable bid deposit is forfeited. The lot is then
/// recovered automatically: it's offered to the next-highest eligible bidder
/// (a fresh escrow with its own funding window — if they default too it cascades),
/// and if no eligible bidder remains it is relisted (reopened Live with a new end
/// time). Set the window to 0 to disable the sweep.
/// </summary>
public class CheckEscrowFundingTimeout : BackgroundService
{
    private static readonly TimeSpan SweepInterval = TimeSpan.FromMinutes(1);

    private readonly ILogger<CheckEscrowFundingTimeout> _logger;
    private readonly IServiceProvider _services;
    private readonly IConfiguration _config;

    public CheckEscrowFundingTimeout(ILogger<CheckEscrowFundingTimeout> logger,
        IServiceProvider services, IConfiguration config)
    {
        _logger = logger;
        _services = services;
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

        using var scope = _services.CreateScope();
        var publishEndpoint = scope.ServiceProvider.GetRequiredService<IPublishEndpoint>();

        foreach (var escrow in expired)
        {
            await ForfeitDeposit(escrow, ct);

            escrow.Status = EscrowStatus.Defaulted;
            escrow.ClosedAt = DateTime.UtcNow;
            escrow.Audit("system", $"buyer did not fund within {windowHours}h; sale defaulted");
            await DB.SaveAsync(escrow, null, ct);
            _logger.LogWarning("SECURITY escrow_defaulted auction={Auction} buyer={Buyer} windowHours={Window}",
                escrow.AuctionId, escrow.Buyer, windowHours);

            await RecoverLot(escrow, publishEndpoint, ct);
        }
    }

    private async Task ForfeitDeposit(Escrow escrow, CancellationToken ct)
    {
        var deposit = await DB.Find<BidDeposit>()
            .Match(d => d.AuctionId == escrow.AuctionId && d.Bidder == escrow.Buyer
                && d.Status == BidDepositStatus.Held)
            .ExecuteFirstAsync(ct);
        if (deposit == null) return;

        deposit.Status = BidDepositStatus.Forfeited;
        deposit.ClosedAt = DateTime.UtcNow;
        await DB.SaveAsync(deposit, null, ct);
        _logger.LogWarning("SECURITY bid_deposit_forfeited_timeout auction={Auction} bidder={Bidder} amount={Amount}",
            escrow.AuctionId, escrow.Buyer, deposit.Amount);
    }

    /// <summary>Offer the lot to the next eligible bidder, else relist it.</summary>
    private async Task RecoverLot(Escrow escrow, IPublishEndpoint publishEndpoint, CancellationToken ct)
    {
        var auction = await DB.Find<Auction>().OneAsync(escrow.AuctionId, ct);
        if (auction == null) return;

        // Bidders who already defaulted on this lot are not offered it again.
        var defaultedBuyers = (await DB.Find<Escrow>()
                .Match(e => e.AuctionId == escrow.AuctionId && e.Status == EscrowStatus.Defaulted)
                .ExecuteAsync(ct))
            .Select(e => e.Buyer)
            .ToHashSet();

        var acceptedBids = await DB.Find<Bid>()
            .Match(b => b.AuctionId == escrow.AuctionId && b.BidStatus == BidStatus.Accepted)
            .Sort(b => b.Descending(x => x.Amount))
            .ExecuteAsync(ct);

        var next = acceptedBids.FirstOrDefault(b =>
            b.Bidder != auction.Seller && !defaultedBuyers.Contains(b.Bidder));

        if (next != null)
        {
            // Don't create a duplicate escrow if this bidder already has one.
            var already = await DB.Find<Escrow>()
                .Match(e => e.AuctionId == escrow.AuctionId && e.Buyer == next.Bidder)
                .ExecuteFirstAsync(ct);
            if (already != null) return;

            var secondChance = new Escrow
            {
                AuctionId = escrow.AuctionId,
                Seller = escrow.Seller,
                Buyer = next.Bidder,
                Amount = next.Amount,
            };
            secondChance.Audit("system", $"second-chance offer after {escrow.Buyer} defaulted");
            await DB.SaveAsync(secondChance, null, ct);
            _logger.LogInformation(
                "SECURITY escrow_second_chance auction={Auction} newBuyer={Buyer} amount={Amount}",
                escrow.AuctionId, next.Bidder, next.Amount);
            return;
        }

        // No eligible bidder left — relist the lot.
        var relistDays = _config.GetValue("BidDeposit:RelistDays", 3);
        var newEnd = DateTime.UtcNow.AddDays(relistDays);
        auction.Finished = false;
        auction.AuctionEnd = newEnd;
        await DB.SaveAsync(auction, null, ct);

        await publishEndpoint.Publish(new AuctionRelisted
        {
            AuctionId = escrow.AuctionId,
            NewAuctionEnd = newEnd,
        }, ct);
        _logger.LogWarning("SECURITY auction_relisted auction={Auction} newEnd={End}", escrow.AuctionId, newEnd);
    }
}
