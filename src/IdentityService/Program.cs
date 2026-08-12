using System.Security.Cryptography.X509Certificates;
using Duende.IdentityServer;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using IdentityService;
using IdentityService.Data;
using IdentityService.Models;
using IdentityService.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();
builder.Services.AddControllers();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.User.RequireUniqueEmail = true;

    // Password policy — hostile-environment defaults.
    options.Password.RequiredLength = 10;
    options.Password.RequireDigit = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = true;

    // Brute-force lockout.
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.AllowedForNewUsers = true;
})
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// BCrypt (work factor 12) with transparent migration off legacy PBKDF2 hashes.
builder.Services.AddScoped<IPasswordHasher<ApplicationUser>, BCryptPasswordHasher>();
builder.Services.AddScoped<IAppEmailSender, EmailSender>();

var idsvcBuilder = builder.Services.AddIdentityServer(options =>
{
    options.Events.RaiseErrorEvents = true;
    options.Events.RaiseInformationEvents = true;
    options.Events.RaiseFailureEvents = true;
    options.Events.RaiseSuccessEvents = true;
    options.EmitStaticAudienceClaim = true;

    // Pin signing to the one static credential added below (dev key locally, the
    // configured X.509 cert in production). Duende's Automatic Key Management is
    // ON by default and mints its OWN rotating signing keys, persisted per host —
    // on an ephemeral filesystem (Railway) those rotate on every redeploy, so any
    // token signed by a rotated-out key fails signature validation at the gateway
    // with a bare 401 that NextAuth can't detect. Disabling it guarantees exactly
    // one stable signing key across every deploy and instance.
    options.KeyManagement.Enabled = false;

    var issuerUri = builder.Configuration["IssuerUri"];
    if (!string.IsNullOrEmpty(issuerUri)) options.IssuerUri = issuerUri;
})
    .AddInMemoryIdentityResources(Config.IdentityResources)
    .AddInMemoryApiScopes(Config.ApiScopes)
    .AddInMemoryClients(Config.Clients(builder.Configuration, builder.Environment.IsDevelopment()))
    .AddAspNetIdentity<ApplicationUser>()
    .AddProfileService<CustomProfileService>()
    // Persist operational data (refresh tokens / grants) in Postgres so that
    // restarting the service no longer invalidates every user's session.
    .AddOperationalStore(options =>
    {
        options.ConfigureDbContext = b => b.UseNpgsql(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            sql => sql.MigrationsAssembly(typeof(Program).Assembly.FullName));
        options.EnableTokenCleanup = true;
        options.TokenCleanupInterval = 3600;
    });

// Signing key: a persisted developer key locally, a managed X.509 certificate in
// production. Refuse to start in production without one rather than silently
// falling back to an ephemeral key that rotates on every restart/instance.
if (builder.Environment.IsDevelopment())
{
    idsvcBuilder.AddDeveloperSigningCredential();
}
else
{
    var certBase64 = builder.Configuration["IdentityServer:SigningCredential:Pfx"];
    var certPath = builder.Configuration["IdentityServer:SigningCredential:Path"];
    var certPassword = builder.Configuration["IdentityServer:SigningCredential:Password"];
    if (!string.IsNullOrWhiteSpace(certBase64))
    {
        // Hosts without mounted secret files (Railway, etc.) inject the .pfx as
        // base64 in an env var. EphemeralKeySet keeps the private key in memory.
        idsvcBuilder.AddSigningCredential(new X509Certificate2(
            Convert.FromBase64String(certBase64), certPassword, X509KeyStorageFlags.EphemeralKeySet));
    }
    else if (!string.IsNullOrWhiteSpace(certPath) && File.Exists(certPath))
    {
        idsvcBuilder.AddSigningCredential(new X509Certificate2(certPath, certPassword));
    }
    else
    {
        throw new InvalidOperationException(
            "Production requires a signing certificate: set IdentityServer:SigningCredential:Pfx " +
            "(base64 of a .pfx) or IdentityServer:SigningCredential:Path. " +
            "Refusing to start with an ephemeral developer key.");
    }
}

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.HttpOnly = true;
});

var authBuilder = builder.Services.AddAuthentication();

// Validate our own JWTs for the verification/profile APIs (called by the
// frontend through the gateway with a Bearer token). The UI keeps using cookies.
authBuilder.AddJwtBearer(options =>
{
    options.Authority = builder.Configuration["IssuerUri"] ?? "http://localhost:5000";
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.TokenValidationParameters.ValidateAudience = false;
    options.TokenValidationParameters.NameClaimType = "username";
    options.TokenValidationParameters.RoleClaimType = "role";
});

// Google OAuth activates only when credentials are configured
// (Authentication:Google:ClientId / ClientSecret via config or user-secrets).
var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
{
    authBuilder.AddGoogle("Google", options =>
    {
        options.SignInScheme = IdentityServerConstants.ExternalCookieAuthenticationScheme;
        options.ClientId = googleClientId;
        options.ClientSecret = googleClientSecret;
    });
}

var app = builder.Build();

// Behind Railway/Render TLS-terminating proxies the request arrives as HTTP with
// an X-Forwarded-Proto: https header. Honour it so IdentityServer emits https://
// discovery/authorize/token URLs instead of http:// (which OIDC clients reject).
var fwd = new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor
        | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
};
fwd.KnownNetworks.Clear();
fwd.KnownProxies.Clear();
app.UseForwardedHeaders(fwd);

// Security headers — chiefly anti-clickjacking on the hosted login/consent
// pages so they can't be framed and overlaid to steal credentials.
app.Use(async (ctx, next) =>
{
    var h = ctx.Response.Headers;
    h["X-Frame-Options"] = "DENY";
    h["Content-Security-Policy"] = "frame-ancestors 'none'";
    h["X-Content-Type-Options"] = "nosniff";
    h["Referrer-Policy"] = "strict-origin-when-cross-origin";
    await next();
});

app.UseStaticFiles();
app.UseRouting();

app.UseIdentityServer();

app.UseAuthorization();

app.MapRazorPages();
app.MapControllers();

DbInitializer.InitDb(app);

app.Run();
