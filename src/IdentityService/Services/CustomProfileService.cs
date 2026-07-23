using System.Security.Claims;
using Duende.IdentityServer.Models;
using Duende.IdentityServer.Services;
using IdentityModel;
using IdentityService.Models;
using Microsoft.AspNetCore.Identity;

namespace IdentityService.Services;

public class CustomProfileService : IProfileService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public CustomProfileService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task GetProfileDataAsync(ProfileDataRequestContext context)
    {
        var user = await _userManager.GetUserAsync(context.Subject);
        if (user == null) return;

        var existingClaims = await _userManager.GetClaimsAsync(user);
        var roles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new Claim("username", user.UserName),
        };
        claims.AddRange(roles.Select(role => new Claim("role", role)));

        context.IssuedClaims.AddRange(claims);

        var nameClaim = existingClaims.FirstOrDefault(x => x.Type == JwtClaimTypes.Name);
        if (nameClaim != null) context.IssuedClaims.Add(nameClaim);
    }

    public Task IsActiveAsync(IsActiveContext context)
    {
        // Deny tokens for locked-out accounts.
        return CheckActive(context);
    }

    private async Task CheckActive(IsActiveContext context)
    {
        var user = await _userManager.GetUserAsync(context.Subject);
        context.IsActive = user != null && !await _userManager.IsLockedOutAsync(user);
    }
}
