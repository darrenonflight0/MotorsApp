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

        foreach (var auction in finishedAuctions)
        {
            auction.Finished = true;
            await auction.SaveAsync(null, stoppingToken);

            var winningBid = await DB.Find<Bid>()
                .Match(a => a.AuctionId == auction.ID)
                .Match(b => b.BidStatus == BidStatus.Accepted)
                .Sort(x => x.Descending(s => s.Amount))
                .ExecuteFirstAsync(stoppingToken);

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
