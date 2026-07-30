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

        SeedData(scope.ServiceProvider.GetService<ApplicationDbContext>(),
            scope.ServiceProvider.GetService<UserManager<ApplicationUser>>(),
            scope.ServiceProvider.GetService<RoleManager<IdentityRole>>());
    }

    private static void SeedData(ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        context.Database.Migrate();

        // Roles are required regardless of whether users already exist.
        foreach (var role in new[] { "Admin", "User" })
        {
            if (!roleManager.RoleExistsAsync(role).Result)
            {
                roleManager.CreateAsync(new IdentityRole(role)).Wait();
            }
        }

        // Backfill the User role for previously seeded accounts.
        foreach (var existing in userManager.Users.ToList())
        {
            if (!userManager.IsInRoleAsync(existing, "User").Result)
            {
                userManager.AddToRoleAsync(existing, "User").Wait();
            }
        }

        // Ensure a platform admin exists. Runs even when other users are already
        // seeded, so an existing database still gets an admin account.
        if (userManager.FindByNameAsync("admin").Result == null)
        {
            var admin = new ApplicationUser
            {
                UserName = "admin",
                Email = "admin@yamkela.example",
                EmailConfirmed = true
            };
            userManager.CreateAsync(admin, "Admin123$pass").Result.ToString();
            userManager.AddClaimsAsync(admin, new Claim[]
            {
                new Claim(JwtClaimTypes.Name, "Platform Admin")
            }).Wait();
            userManager.AddToRoleAsync(admin, "Admin").Wait();
            Console.WriteLine("Admin user seeded");
        }

        // Demo seller accounts. Seeded individually (like the admin above) so they
        // exist even when the database already has other users — previously the
        // blanket `Users.Any()` guard ran after the admin was created and skipped
        // these entirely. NOTE: these are known-credential test accounts; remove
        // them for a genuinely public launch.
        SeedUser(userManager, "bob", "Bob Smith", "bob@test.com");
        SeedUser(userManager, "alice", "Alice Smith", "alice@test.com");

        Console.WriteLine("Identity data seeded");
    }

    private static void SeedUser(UserManager<ApplicationUser> userManager,
        string userName, string displayName, string email)
    {
        if (userManager.FindByNameAsync(userName).Result != null) return;

        var user = new ApplicationUser { UserName = userName, Email = email, EmailConfirmed = true };
        userManager.CreateAsync(user, "Pass123$word").Wait();
        userManager.AddClaimsAsync(user, new[] { new Claim(JwtClaimTypes.Name, displayName) }).Wait();
        userManager.AddToRoleAsync(user, "User").Wait();
    }
}
