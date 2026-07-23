using System.ComponentModel.DataAnnotations;
using Duende.IdentityServer.Services;
using IdentityService.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace IdentityService.Pages.Account.Login;

public class Index : PageModel
{
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IIdentityServerInteractionService _interaction;
    private readonly IAuthenticationSchemeProvider _schemeProvider;
    private readonly ILogger<Index> _logger;

    public Index(SignInManager<ApplicationUser> signInManager,
        IIdentityServerInteractionService interaction,
        IAuthenticationSchemeProvider schemeProvider,
        ILogger<Index> logger)
    {
        _signInManager = signInManager;
        _interaction = interaction;
        _schemeProvider = schemeProvider;
        _logger = logger;
    }

    [BindProperty]
    public InputModel Input { get; set; }

    public IReadOnlyList<string> ExternalProviders { get; private set; } = Array.Empty<string>();

    [TempData]
    public string Message { get; set; }

    public async Task<IActionResult> OnGet(string returnUrl)
    {
        Input = new InputModel { ReturnUrl = returnUrl };
        await LoadExternalProviders();
        return Page();
    }

    public async Task<IActionResult> OnPost()
    {
        await LoadExternalProviders();

        if (Input.Button != "login") return Redirect("~/");

        if (!ModelState.IsValid) return Page();

        var result = await _signInManager.PasswordSignInAsync(
            Input.Username, Input.Password, false, lockoutOnFailure: true);

        if (result.Succeeded)
        {
            _logger.LogInformation("SECURITY login_success user={User}", Input.Username);

            if (_interaction.IsValidReturnUrl(Input.ReturnUrl) || Url.IsLocalUrl(Input.ReturnUrl))
            {
                return Redirect(Input.ReturnUrl ?? "~/");
            }

            return Redirect("~/");
        }

        if (result.IsLockedOut)
        {
            _logger.LogWarning("SECURITY login_lockout user={User}", Input.Username);
            ModelState.AddModelError(string.Empty,
                "Account temporarily locked after repeated failed attempts. Try again in 15 minutes.");
            return Page();
        }

        _logger.LogWarning("SECURITY login_failed user={User}", Input.Username);
        ModelState.AddModelError(string.Empty, "Invalid username or password");
        return Page();
    }

    private async Task LoadExternalProviders()
    {
        var schemes = await _schemeProvider.GetAllSchemesAsync();
        ExternalProviders = schemes
            .Where(s => !string.IsNullOrEmpty(s.DisplayName) || s.Name == "Google")
            .Select(s => s.Name)
            .Where(n => n == "Google")
            .ToList();
    }

    public class InputModel
    {
        [Required]
        public string Username { get; set; }

        [Required]
        public string Password { get; set; }

        public string ReturnUrl { get; set; }

        public string Button { get; set; }
    }
}
