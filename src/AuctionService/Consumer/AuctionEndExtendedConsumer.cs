using AuctionService.Data;
using Contracts;
using MassTransit;

namespace AuctionService.Consumer;

public class AuctionEndExtendedConsumer : IConsumer<AuctionEndExtended>
{
    private readonly AuctionDbContext _dbContext;

    public AuctionEndExtendedConsumer(AuctionDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task Consume(ConsumeContext<AuctionEndExtended> context)
    {
        Console.WriteLine("--> Consuming auction end extended: " + context.Message.AuctionId);

        var auction = await _dbContext.Auctions.FindAsync(Guid.Parse(context.Message.AuctionId));

        if (auction == null) return;

        auction.AuctionEnd = context.Message.NewAuctionEnd;
        await _dbContext.SaveChangesAsync();
    }
}
