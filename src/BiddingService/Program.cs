using BiddingService.Consumers;
using BiddingService.Services;
using BiddingService.Services.Payments;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using MongoDB.Driver;
using MongoDB.Entities;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
builder.Services.AddMassTransit(x =>
{
    x.AddConsumersFromNamespaceContaining<AuctionCreatedConsumer>();
    x.SetEndpointNameFormatter(new KebabCaseEndpointNameFormatter("bids", false));
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(builder.Configuration["RabbitMq:Host"] ?? "localhost", "/", host =>
        {
            host.Username(builder.Configuration.GetValue("RabbitMq:Username", "guest"));
            host.Password(builder.Configuration.GetValue("RabbitMq:Password", "guest"));
        });
        cfg.ConfigureEndpoints(context);
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["IdentityServiceUrl"];
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters.ValidateAudience = false;
        options.TokenValidationParameters.NameClaimType = "username";
        options.TokenValidationParameters.RoleClaimType = "role";
    });

builder.Services.AddHostedService<CheckAuctionFinished>();
builder.Services.AddSingleton<BidLedger>();

// Escrow payment provider. Defaults to the simulated provider; select a real
// processor with Payments:Provider = Stripe | Paystack (+ that provider's
// SecretKey). Guard against accidentally running the simulation in production.
var paymentProvider = builder.Configuration["Payments:Provider"] ?? "Simulated";
switch (paymentProvider.ToLowerInvariant())
{
    case "stripe":
        builder.Services.AddHttpClient<IEscrowPaymentProvider, StripeEscrowPaymentProvider>();
        break;
    case "paystack":
        builder.Services.AddHttpClient<IEscrowPaymentProvider, PaystackEscrowPaymentProvider>();
        break;
    default:
        if (!builder.Environment.IsDevelopment())
        {
            throw new InvalidOperationException(
                "The simulated payment provider must not run outside Development. " +
                "Set Payments:Provider to Stripe or Paystack and configure its SecretKey.");
        }
        builder.Services.AddSingleton<IEscrowPaymentProvider, SimulatedEscrowPaymentProvider>();
        break;
}

builder.Services.AddHttpClient<AuctionServiceHttpClient>(client =>
{
    var baseUrl = builder.Configuration["AuctionServiceUrl"] ?? "http://localhost:7001";
    client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
});

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await DB.InitAsync("BidDb", MongoClientSettings
    .FromConnectionString(builder.Configuration.GetConnectionString("BidDbConnection")));

app.Run();
