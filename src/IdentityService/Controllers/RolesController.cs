using IdentityModel;
using IdentityService.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Controllers;

/// <summary>
/// Admin-only management of who else is a platform admin. Grants/revokes the
/// "Admin" role (an <c>AspNetUserRoles</c> row) with guard rails so an admin
/// can't lock everyone out.
/// </summary>
[ApiController]
[Route("api/roles")]
[Authorize(Roles = "Admin", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class RolesController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<RolesController> _logger;

    public RolesController(UserManager<ApplicationUser> userManager, ILogger<RolesController> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    private string CurrentUser => User.Identity!.Name;

    private async Task<object> ToDto(ApplicationUser u)
    {
        var claims = await _userManager.GetClaimsAsync(u);
        var name = claims.FirstOrDefault(c => c.Type == JwtClaimTypes.Name)?.Value ?? u.UserName;
        return new
        {
            username = u.UserName,
            name,
            verified = u.IsVerified,
            isAdmin = await _userManager.IsInRoleAsync(u, "Admin"),
            profilePicture = u.ProfilePicture,
        };
    }

    /// <summary>Empty query lists the current admins; a query searches all users
    /// by username (so you can find someone to promote).</summary>
    [HttpGet("users")]
    public async Task<IActionResult> Users([FromQuery] string? q)
    {
        var term = (q ?? string.Empty).Trim();

        List<ApplicationUser> users;
        if (term.Length == 0)
        {
            users = (await _userManager.GetUsersInRoleAsync("Admin"))
                .OrderBy(u => u.UserName).ToList();
        }
        else
        {
            users = await _userManager.Users
                .Where(u => EF.Functions.ILike(u.UserName, $"%{term}%"))
                .OrderBy(u => u.UserName)
                .Take(20)
                .ToListAsync();
        }

        var results = new List<object>();
        foreach (var u in users) results.Add(await ToDto(u));
        return Ok(results);
    }

    /// <summary>Grant the Admin role to a user.</summary>
    [HttpPost("{username}/admin")]
    public async Task<IActionResult> Grant(string username)
    {
        var user = await _userManager.FindByNameAsync(username);
        if (user == null) return NotFound();

        if (!await _userManager.IsInRoleAsync(user, "Admin"))
            await _userManager.AddToRoleAsync(user, "Admin");

        _logger.LogWarning("SECURITY admin_granted user={User} by={By}", user.UserName, CurrentUser);
        return Ok(await ToDto(user));
    }

    /// <summary>Revoke the Admin role. Cannot demote yourself or the last admin.</summary>
    [HttpDelete("{username}/admin")]
    public async Task<IActionResult> Revoke(string username)
    {
        var user = await _userManager.FindByNameAsync(username);
        if (user == null) return NotFound();

        if (string.Equals(user.UserName, CurrentUser, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "You cannot remove your own admin access." });

        var admins = await _userManager.GetUsersInRoleAsync("Admin");
        if (admins.Count <= 1)
            return BadRequest(new { error = "At least one admin must remain." });

        if (await _userManager.IsInRoleAsync(user, "Admin"))
            await _userManager.RemoveFromRoleAsync(user, "Admin");

        _logger.LogWarning("SECURITY admin_revoked user={User} by={By}", user.UserName, CurrentUser);
        return Ok(await ToDto(user));
    }
}
