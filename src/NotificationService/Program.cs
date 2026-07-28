using MassTransit;
using NotificationService.Consumers;
using NotificationService.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSignalR();
builder.Services.AddMassTransit(x =>
{
    x.AddConsumersFromNamespaceContaining<AuctionCreatedConsumer>();
    x.SetEndpointNameFormatter(new KebabCaseEndpointNameFormatter("nt", false));
    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitUrl = builder.Configuration["RabbitMq:Url"];
        if (!string.IsNullOrEmpty(rabbitUrl))
        {
            // Full amqp(s):// URI — used by managed brokers like CloudAMQP (TLS + vhost).
            cfg.Host(new Uri(rabbitUrl));
        }
        else
        {
            cfg.Host(builder.Configuration["RabbitMq:Host"] ?? "localhost", "/", host =>
            {
                host.Username(builder.Configuration.GetValue("RabbitMq:Username", "guest"));
                host.Password(builder.Configuration.GetValue("RabbitMq:Password", "guest"));
            });
        }
        cfg.ConfigureEndpoints(context);
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        // Browser origin allowed to open the SignalR connection — the frontend
        // URL (localhost in dev, the deployed site in production).
        var clientApp = builder.Configuration["ClientApp"] ?? "http://localhost:3000";
        policy.WithOrigins(clientApp)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("frontend");

app.MapHub<NotificationHub>("/notifications");

app.Run();
