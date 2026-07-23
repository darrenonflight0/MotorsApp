using Contracts;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using NotificationService.Hubs;

namespace NotificationService.Consumers;

public class AuctionEndExtendedConsumer : IConsumer<AuctionEndExtended>
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public AuctionEndExtendedConsumer(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task Consume(ConsumeContext<AuctionEndExtended> context)
    {
        Console.WriteLine("--> auction end extended message received");

        await _hubContext.Clients.All.SendAsync("AuctionEndExtended", context.Message);
    }
}
