using Contracts;
using MassTransit;
using MongoDB.Entities;
using SearchService;

namespace SearchService.Consumers;

public class AuctionEndExtendedConsumer : IConsumer<AuctionEndExtended>
{
    public async Task Consume(ConsumeContext<AuctionEndExtended> context)
    {
        Console.WriteLine("--> Consuming auction end extended: " + context.Message.AuctionId);

        var result = await DB.Update<Item>()
            .Match(a => a.ID == context.Message.AuctionId)
            .Modify(b => b.Set(x => x.AuctionEnd, context.Message.NewAuctionEnd))
            .ExecuteAsync();

        if (!result.IsAcknowledged)
            throw new MessageException(typeof(AuctionEndExtended), "Problem updating mongodb");
    }
}
