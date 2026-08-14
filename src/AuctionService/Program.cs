using AuctionService.Consumer;
using AuctionService.Data;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddDbContext<AuctionDbContext>(opt =>
{
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));

});
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
builder.Services.AddMassTransit(x =>
{

    x.AddEntityFrameworkOutbox<AuctionDbContext>(o =>
    {
        o.QueryDelay = TimeSpan.FromSeconds(10);

        o.UsePostgres();
        o.UseBusOutbox();
    });
    x.AddConsumersFromNamespaceContaining<AuctionCreatedFaultConsumer>();
    x.SetEndpointNameFormatter(new KebabCaseEndpointNameFormatter("auction", false));
    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitUrl = builder.Configuration["RabbitMq:Url"];
        if (!string.IsNullOrEmpty(rabbitUrl))
        {
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

var identityUrl = builder.Configuration["IdentityServiceUrl"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = identityUrl;
        // Only require HTTPS metadata when the authority is actually https, so an
        // internal http identity URL doesn't make the JWT handler throw.
        options.RequireHttpsMetadata = identityUrl?.StartsWith("https", StringComparison.OrdinalIgnoreCase) ?? false;
        options.MapInboundClaims = false;
        options.TokenValidationParameters.ValidateAudience = false;
        options.TokenValidationParameters.NameClaimType = "username";
        options.TokenValidationParameters.RoleClaimType = "role";
    });

// Used to check a seller's live verification status at listing time.
builder.Services.AddHttpClient("identity", client =>
{
    var baseUrl = identityUrl ?? "http://localhost:5000";
    client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
});


var app = builder.Build();



app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
try
{
    DbInitializer.InitDb(app);

}
catch (Exception e)
{
    Console.WriteLine(e);
}

app.Run();
