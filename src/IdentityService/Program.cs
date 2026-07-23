using System.Security.Cryptography.X509Certificates;
using Duende.IdentityServer;
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
    var certPath = builder.Configuration["IdentityServer:SigningCredential:Path"];
    var certPassword = builder.Configuration["IdentityServer:SigningCredential:Password"];
    if (string.IsNullOrWhiteSpace(certPath) || !File.Exists(certPath))
    {
        throw new InvalidOperationException(
            "Production requires a signing certificate at IdentityServer:SigningCredential:Path. " +
            "Refusing to start with an ephemeral developer key.");
    }
    idsvcBuilder.AddSigningCredential(new X509Certificate2(certPath, certPassword));
}

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.HttpOnly = true;
});

var authBuilder = builder.Services.AddAuthentication();

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

app.UseStaticFiles();
app.UseRouting();

app.UseIdentityServer();

app.UseAuthorization();

app.MapRazorPages();
app.MapControllers();

DbInitializer.InitDb(app);

app.Run();
