using AuctionService.Data;
using AuctionService.Entities;
using Contracts;
using MassTransit;

namespace AuctionService.Consumer;

public class AuctionRelistedConsumer : IConsumer<AuctionRelisted>
{
    private readonly AuctionDbContext _dbContext;

    public AuctionRelistedConsumer(AuctionDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task Consume(ConsumeContext<AuctionRelisted> context)
    {
        Console.WriteLine("--> Consuming auction relisted: " + context.Message.AuctionId);

        var auction = await _dbContext.Auctions.FindAsync(Guid.Parse(context.Message.AuctionId));
        if (auction == null) return;

        // Reopen the lot for sale and clear the defaulted outcome.
        auction.AuctionEnd = context.Message.NewAuctionEnd;
        auction.Status = Status.Live;
        auction.Winner = null;
        auction.SoldAmount = null;

        await _dbContext.SaveChangesAsync();
    }
}
