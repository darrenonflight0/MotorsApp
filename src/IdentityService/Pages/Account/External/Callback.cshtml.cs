using System.Security.Claims;
using Duende.IdentityServer;
using IdentityModel;
using IdentityService.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace IdentityService.Pages.Account.External;

[AllowAnonymous]
public class Callback : PageModel
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ILogger<Callback> _logger;

    public Callback(UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ILogger<Callback> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _logger = logger;
    }

    public async Task<IActionResult> OnGet()
    {
        var result = await HttpContext.AuthenticateAsync(
            IdentityServerConstants.ExternalCookieAuthenticationScheme);

        if (result.Succeeded != true)
        {
            _logger.LogWarning("SECURITY external_login_failed");
            return RedirectToPage("/Account/Login/Index");
        }

        var externalUser = result.Principal;
        var scheme = result.Properties.Items["scheme"];
        var returnUrl = result.Properties.Items.TryGetValue("returnUrl", out var r) ? r : "~/";

        var userIdClaim = externalUser.FindFirst(JwtClaimTypes.Subject)
                          ?? externalUser.FindFirst(ClaimTypes.NameIdentifier)
                          ?? throw new InvalidOperationException("Unknown external user id");

        var provider = scheme;
        var providerUserId = userIdClaim.Value;

        var user = await _userManager.FindByLoginAsync(provider, providerUserId);
        if (user == null)
        {
            user = await AutoProvisionUser(externalUser, provider, providerUserId);
        }

        if (await _userManager.IsLockedOutAsync(user))
        {
            _logger.LogWarning("SECURITY external_login_lockedout user={User}", user.UserName);
            return RedirectToPage("/Account/Login/Index");
        }

        await _signInManager.SignInAsync(user, isPersistent: false);
        await HttpContext.SignOutAsync(IdentityServerConstants.ExternalCookieAuthenticationScheme);

        _logger.LogInformation("SECURITY external_login_success user={User} provider={Provider}",
            user.UserName, provider);

        if (Url.IsLocalUrl(returnUrl) || returnUrl.StartsWith("~/"))
        {
            return Redirect(returnUrl);
        }

        return Redirect("~/");
    }

    private async Task<ApplicationUser> AutoProvisionUser(
        ClaimsPrincipal externalUser, string provider, string providerUserId)
    {
        var email = externalUser.FindFirst(JwtClaimTypes.Email)?.Value
                    ?? externalUser.FindFirst(ClaimTypes.Email)?.Value;
        var name = externalUser.FindFirst(JwtClaimTypes.Name)?.Value
                   ?? externalUser.FindFirst(ClaimTypes.Name)?.Value
                   ?? email
                   ?? providerUserId;

        // Link by verified email when the account already exists locally.
        if (!string.IsNullOrEmpty(email))
        {
            var existing = await _userManager.FindByEmailAsync(email);
            if (existing != null)
            {
                await _userManager.AddLoginAsync(existing,
                    new UserLoginInfo(provider, providerUserId, provider));
                return existing;
            }
        }

        var baseUsername = !string.IsNullOrEmpty(email)
            ? email.Split('@')[0]
            : $"user{Random.Shared.Next(10000, 99999)}";
        baseUsername = new string(baseUsername
            .Where(c => char.IsLetterOrDigit(c) || c is '.' or '-' or '_').ToArray());
        if (string.IsNullOrEmpty(baseUsername)) baseUsername = "user";

        var username = baseUsername;
        var suffix = 1;
        while (await _userManager.FindByNameAsync(username) != null)
        {
            username = $"{baseUsername}{suffix++}";
        }

        var user = new ApplicationUser
        {
            UserName = username,
            Email = email,
            EmailConfirmed = !string.IsNullOrEmpty(email),
        };

        var created = await _userManager.CreateAsync(user);
        if (!created.Succeeded)
        {
            throw new InvalidOperationException(
                $"Could not provision external user: {created.Errors.FirstOrDefault()?.Description}");
        }

        await _userManager.AddClaimAsync(user, new Claim(JwtClaimTypes.Name, name));
        await _userManager.AddToRoleAsync(user, "User");
        await _userManager.AddLoginAsync(user, new UserLoginInfo(provider, providerUserId, provider));

        _logger.LogInformation("SECURITY external_user_provisioned user={User} provider={Provider}",
            username, provider);

        return user;
    }
}
