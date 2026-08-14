using Contracts;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using NotificationService.Hubs;

namespace NotificationService.Consumers;

public class AnnouncementBroadcastConsumer : IConsumer<AnnouncementBroadcast>
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public AnnouncementBroadcastConsumer(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task Consume(ConsumeContext<AnnouncementBroadcast> context)
    {
        Console.WriteLine("--> broadcasting announcement: " + context.Message.Title);

        await _hubContext.Clients.All.SendAsync("Announcement", context.Message);
    }
}
