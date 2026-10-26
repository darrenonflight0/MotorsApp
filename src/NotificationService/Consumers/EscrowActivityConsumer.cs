using Contracts;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using NotificationService.Hubs;

namespace NotificationService.Consumers;

public class EscrowActivityConsumer : IConsumer<EscrowActivity>
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public EscrowActivityConsumer(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task Consume(ConsumeContext<EscrowActivity> context)
    {
        Console.WriteLine($"--> escrow activity received: {context.Message.Kind}");

        // Same pattern as SecondChanceOffered: broadcast, the client keeps only its own.
        await _hubContext.Clients.All.SendAsync("EscrowActivity", context.Message);
    }
}
