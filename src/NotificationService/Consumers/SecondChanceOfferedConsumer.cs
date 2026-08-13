using Contracts;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using NotificationService.Hubs;

namespace NotificationService.Consumers;

public class SecondChanceOfferedConsumer : IConsumer<SecondChanceOffered>
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public SecondChanceOfferedConsumer(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task Consume(ConsumeContext<SecondChanceOffered> context)
    {
        Console.WriteLine("--> second chance offered message received");

        await _hubContext.Clients.All.SendAsync("SecondChanceOffered", context.Message);
    }
}
