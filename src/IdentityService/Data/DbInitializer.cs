using System.Security.Claims;
using IdentityModel;
using IdentityService.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Data;

public class DbInitializer
{
    public static void InitDb(WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        // Apply the IdentityServer operational-store schema (persisted grants /
        // refresh tokens) so it exists before the server starts issuing tokens.
        scope.ServiceProvider
            .GetRequiredService<Duende.IdentityServer.EntityFramework.DbContexts.PersistedGrantDbContext>()
            .Database.Migrate();

        SeedData(
            scope.ServiceProvider.GetService<ApplicationDbContext>(),
            scope.ServiceProvider.GetService<UserManager<ApplicationUser>>(),
            scope.ServiceProvider.GetService<RoleManager<IdentityRole>>(),
            app.Configuration,
            app.Environment.IsDevelopment());
    }

    private static void SeedData(ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration config,
        bool isDevelopment)
    {
        context.Database.Migrate();

        // Roles are required regardless of whether users already exist.
        foreach (var role in new[] { "Admin", "User" })
        {
            if (!roleManager.RoleExistsAsync(role).Result)
                roleManager.CreateAsync(new IdentityRole(role)).Wait();
        }

        // Backfill the User role for previously seeded accounts.
        foreach (var existing in userManager.Users.ToList())
        {
            if (!userManager.IsInRoleAsync(existing, "User").Result)
                userManager.AddToRoleAsync(existing, "User").Wait();
        }

        SeedAdmin(userManager, config, isDevelopment);

        // Demo/test accounts carry known credentials, so they are opt-in: on by
        // default only in development. Enable elsewhere with Seed:DemoUsers=true.
        if (config.GetValue("Seed:DemoUsers", isDevelopment))
        {
            var demoPassword = config["Seed:DemoPassword"] ?? "Pass123$word";
            SeedUser(userManager, "bob", "Bob Smith", "bob@test.com", demoPassword);
            SeedUser(userManager, "alice", "Alice Smith", "alice@test.com", demoPassword);
        }

        Console.WriteLine("Identity data seeded");
    }

    private static void SeedAdmin(UserManager<ApplicationUser> userManager, IConfiguration config, bool isDevelopment)
    {
        // The admin password is never baked into the build. It comes from
        // Seed:AdminPassword; production refuses to start without it, so there is
        // no default admin credential sitting in source control.
        var configured = config["Seed:AdminPassword"];
        var password = configured;
        if (string.IsNullOrWhiteSpace(password))
        {
            if (!isDevelopment)
                throw new InvalidOperationException(
                    "Seed:AdminPassword must be configured in production (e.g. env var Seed__AdminPassword). " +
                    "No default admin password is compiled into the build.");
            password = "Admin123$pass"; // development convenience only
        }

        var admin = userManager.FindByNameAsync("admin").Result;
        if (admin == null)
        {
            admin = new ApplicationUser
            {
                UserName = "admin",
                Email = "admin@yamkela.example",
                EmailConfirmed = true,
            };
            userManager.CreateAsync(admin, password).Wait();
            userManager.AddClaimsAsync(admin, new[] { new Claim(JwtClaimTypes.Name, "Platform Admin") }).Wait();
            userManager.AddToRoleAsync(admin, "Admin").Wait();
            Console.WriteLine("Admin user seeded");
        }
        else if (!string.IsNullOrWhiteSpace(configured))
        {
            // Rotate an existing admin onto the configured secret so any account
            // that shipped with an old default is superseded on first deploy.
            var token = userManager.GeneratePasswordResetTokenAsync(admin).Result;
            userManager.ResetPasswordAsync(admin, token, password).Wait();
            if (!userManager.IsInRoleAsync(admin, "Admin").Result)
                userManager.AddToRoleAsync(admin, "Admin").Wait();
        }
    }

    private static void SeedUser(UserManager<ApplicationUser> userManager,
        string userName, string displayName, string email, string password)
    {
        if (userManager.FindByNameAsync(userName).Result != null) return;

        var user = new ApplicationUser { UserName = userName, Email = email, EmailConfirmed = true };
        userManager.CreateAsync(user, password).Wait();
        userManager.AddClaimsAsync(user, new[] { new Claim(JwtClaimTypes.Name, displayName) }).Wait();
        userManager.AddToRoleAsync(user, "User").Wait();
    }
}
