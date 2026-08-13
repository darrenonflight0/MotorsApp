using BiddingService.Models;
using Contracts;
using MassTransit;
using MongoDB.Entities;

namespace BiddingService.Services;

public class CheckAuctionFinished : BackgroundService
{
    private readonly ILogger<CheckAuctionFinished> _logger;
    private readonly IServiceProvider _services;

    public CheckAuctionFinished(ILogger<CheckAuctionFinished> logger, IServiceProvider services)
    {
        _logger = logger;
        _services = services;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Starting check for finished auctions");

        stoppingToken.Register(() => _logger.LogInformation("==> Auction check is stopping"));

        while (!stoppingToken.IsCancellationRequested)
        {
            await CheckAuctions(stoppingToken);

            await Task.Delay(5000, stoppingToken);
        }
    }

    private async Task CheckAuctions(CancellationToken stoppingToken)
    {
        var finishedAuctions = await DB.Find<Auction>()
            .Match(x => x.AuctionEnd <= DateTime.UtcNow)
            .Match(x => !x.Finished)
            .ExecuteAsync(stoppingToken);

        if (finishedAuctions.Count == 0) return;

        _logger.LogInformation("==> Found {count} auctions that have completed", finishedAuctions.Count);

        using var scope = _services.CreateScope();
        var endpoint = scope.ServiceProvider.GetRequiredService<IPublishEndpoint>();
        var payments = scope.ServiceProvider.GetRequiredService<Payments.IEscrowPaymentProvider>();

        foreach (var auction in finishedAuctions)
        {
            auction.Finished = true;
            await auction.SaveAsync(null, stoppingToken);

            // A bidder who already defaulted on this lot (winner ghosted, escrow
            // Defaulted) cannot win it again on a relist.
            var defaultedBuyers = (await DB.Find<Escrow>()
                    .Match(e => e.AuctionId == auction.ID && e.Status == EscrowStatus.Defaulted)
                    .ExecuteAsync(stoppingToken))
                .Select(e => e.Buyer)
                .ToHashSet();

            var acceptedBids = await DB.Find<Bid>()
                .Match(a => a.AuctionId == auction.ID)
                .Match(b => b.BidStatus == BidStatus.Accepted)
                .Sort(x => x.Descending(s => s.Amount))
                .ExecuteAsync(stoppingToken);

            var winningBid = acceptedBids.FirstOrDefault(b => !defaultedBuyers.Contains(b.Bidder));

            // Sold lots settle through escrow: funds are held by the platform
            // until the buyer confirms delivery.
            if (winningBid != null)
            {
                var existing = await DB.Find<Escrow>()
                    .Match(e => e.AuctionId == auction.ID)
                    .ExecuteFirstAsync(stoppingToken);

                if (existing == null)
                {
                    var escrow = new Escrow
                    {
                        AuctionId = auction.ID,
                        Seller = auction.Seller,
                        Buyer = winningBid.Bidder,
                        Amount = winningBid.Amount,
                    };
                    escrow.Audit("system", "created on auction finish");
                    await DB.SaveAsync(escrow, null, stoppingToken);

                    _logger.LogInformation(
                        "SECURITY escrow_created auction={Auction} buyer={Buyer} seller={Seller} amount={Amount}",
                        auction.ID, winningBid.Bidder, auction.Seller, winningBid.Amount);
                }
            }

            // Return refundable bid deposits to everyone except the winner (whose
            // deposit stays held against their obligation to fund the escrow).
            var winner = winningBid?.Bidder;
            var deposits = await DB.Find<BidDeposit>()
                .Match(d => d.AuctionId == auction.ID && d.Status == BidDepositStatus.Held)
                .ExecuteAsync(stoppingToken);
            foreach (var dep in deposits)
            {
                if (dep.Bidder == winner) continue;
                var refund = await payments.RefundPaymentAsync(dep.PaymentReference, stoppingToken);
                dep.Status = BidDepositStatus.Refunded;
                dep.RefundReference = refund.ProviderReference;
                dep.ClosedAt = DateTime.UtcNow;
                await DB.SaveAsync(dep, null, stoppingToken);
                _logger.LogInformation(
                    "SECURITY bid_deposit_refunded auction={Auction} bidder={Bidder} ok={Ok}",
                    auction.ID, dep.Bidder, refund.Success);
            }

            await endpoint.Publish(new AuctionFinished
            {
                ItemSold = winningBid != null,
                AuctionId = auction.ID,
                Winner = winningBid?.Bidder,
                Amount = winningBid?.Amount ?? 0,
                Seller = auction.Seller
            }, stoppingToken);
        }
    }
}
