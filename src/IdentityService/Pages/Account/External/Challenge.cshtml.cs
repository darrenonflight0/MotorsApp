using Duende.IdentityServer.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace IdentityService.Pages.Account.External;

[AllowAnonymous]
public class Challenge : PageModel
{
    private readonly IIdentityServerInteractionService _interaction;

    public Challenge(IIdentityServerInteractionService interaction)
    {
        _interaction = interaction;
    }

    public IActionResult OnGet(string scheme, string returnUrl)
    {
        if (string.IsNullOrEmpty(returnUrl)) returnUrl = "~/";

        // Only allow redirects back into the authorize flow or local pages.
        if (!Url.IsLocalUrl(returnUrl) && !_interaction.IsValidReturnUrl(returnUrl))
        {
            throw new InvalidOperationException("Invalid return URL");
        }

        var props = new AuthenticationProperties
        {
            RedirectUri = Url.Page("/Account/External/Callback"),
            Items =
            {
                { "returnUrl", returnUrl },
                { "scheme", scheme },
            }
        };

        return Challenge(props, scheme);
    }
}
