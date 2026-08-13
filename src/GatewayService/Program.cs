using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["IdentityServiceUrl"];
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        // Don't remap inbound claims; the default map renames "role" to the long
        // ClaimTypes.Role URI, which would break any role-based gateway policy.
        options.MapInboundClaims = false;
        options.TokenValidationParameters.ValidateAudience = false;
        options.TokenValidationParameters.NameClaimType = "username";
        options.TokenValidationParameters.RoleClaimType = "role";
    });

builder.Services.AddAuthorization();

// Abuse throttling: fixed windows partitioned per authenticated user
// (falling back to client IP). Writes are throttled tighter than reads.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var client = context.User.Identity?.Name
                     ?? context.Connection.RemoteIpAddress?.ToString()
                     ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(client, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 200,
            Window = TimeSpan.FromSeconds(10),
            QueueLimit = 0,
        });
    });

    options.AddPolicy("writes", context =>
    {
        var client = context.User.Identity?.Name
                     ?? context.Connection.RemoteIpAddress?.ToString()
                     ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(client, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 20,
            Window = TimeSpan.FromSeconds(10),
            QueueLimit = 0,
        });
    });
});

var app = builder.Build();

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapReverseProxy();

app.Run();
