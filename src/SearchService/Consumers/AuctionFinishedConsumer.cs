using Contracts;
using MassTransit;
using MongoDB.Entities;

namespace SearchService.Consumers;

public class AuctionFinishedConsumer : IConsumer<AuctionFinished>
{
    public async Task Consume(ConsumeContext<AuctionFinished> context)
    {
        Console.WriteLine("--> Consuming auction finished: " + context.Message.AuctionId);

        var auction = await DB.Find<Item>().OneAsync(context.Message.AuctionId);

        if (auction == null) return;

        if (context.Message.ItemSold)
        {
            auction.Winner = context.Message.Winner;
            auction.SoldAmount = context.Message.Amount;
        }

        auction.Status = "Finished";
        auction.UpdatedAt = DateTime.UtcNow;

        await DB.SaveAsync(auction);
    }
}
