using Contracts;
using MassTransit;
using MongoDB.Entities;

namespace SearchService.Consumers;

public class AuctionRelistedConsumer : IConsumer<AuctionRelisted>
{
    public async Task Consume(ConsumeContext<AuctionRelisted> context)
    {
        Console.WriteLine("--> Consuming auction relisted: " + context.Message.AuctionId);

        var item = await DB.Find<Item>().OneAsync(context.Message.AuctionId);
        if (item == null) return;

        item.AuctionEnd = context.Message.NewAuctionEnd;
        item.Status = "Live";
        item.Winner = null;
        item.SoldAmount = 0;
        item.UpdatedAt = DateTime.UtcNow;

        await DB.SaveAsync(item);
    }
}
