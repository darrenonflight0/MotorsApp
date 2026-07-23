using System.ComponentModel.DataAnnotations;
using IdentityService.Models;
using IdentityService.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace IdentityService.Pages.Account.Forgot;

public class Index : PageModel
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IAppEmailSender _emailSender;
    private readonly ILogger<Index> _logger;

    public Index(UserManager<ApplicationUser> userManager,
        IAppEmailSender emailSender,
        ILogger<Index> logger)
    {
        _userManager = userManager;
        _emailSender = emailSender;
        _logger = logger;
    }

    [BindProperty]
    public InputModel Input { get; set; }

    public bool Sent { get; private set; }

    public void OnGet()
    {
        Input = new InputModel();
    }

    public async Task<IActionResult> OnPost()
    {
        if (!ModelState.IsValid) return Page();

        // Always report success to prevent account enumeration.
        Sent = true;

        var user = await _userManager.FindByEmailAsync(Input.Email);
        if (user == null)
        {
            _logger.LogWarning("SECURITY password_reset_unknown_email email={Email}", Input.Email);
            return Page();
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var link = Url.Page("/Account/Reset/Index", pageHandler: null,
            values: new { email = Input.Email, token }, protocol: Request.Scheme);

        await _emailSender.SendAsync(Input.Email, "Reset your Yamkela Motors password",
            $"""
             <p>Someone requested a password reset for your Yamkela Motors account.</p>
             <p><a href="{link}">Reset your password</a></p>
             <p>If this wasn't you, ignore this email. We never ask for your password,
             card number or banking details by email.</p>
             """);

        _logger.LogInformation("SECURITY password_reset_requested user={User}", user.UserName);
        return Page();
    }

    public class InputModel
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }
}
