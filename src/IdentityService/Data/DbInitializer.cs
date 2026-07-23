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

        if (userManager.Users.Any()) return;

        var bob = new ApplicationUser
        {
            UserName = "bob",
            Email = "bob@test.com",
            EmailConfirmed = true
        };

        userManager.CreateAsync(bob, "Pass123$word").Result.ToString();
        userManager.AddClaimsAsync(bob, new Claim[]
        {
            new Claim(JwtClaimTypes.Name, "Bob Smith")
        }).Wait();
        userManager.AddToRoleAsync(bob, "User").Wait();

        var alice = new ApplicationUser
        {
            UserName = "alice",
            Email = "alice@test.com",
            EmailConfirmed = true
        };

        userManager.CreateAsync(alice, "Pass123$word").Result.ToString();
        userManager.AddClaimsAsync(alice, new Claim[]
        {
            new Claim(JwtClaimTypes.Name, "Alice Smith")
        }).Wait();
        userManager.AddToRoleAsync(alice, "User").Wait();

        Console.WriteLine("Identity data seeded");
    }
}
