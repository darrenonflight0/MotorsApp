using System.ComponentModel.DataAnnotations;
using IdentityService.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace IdentityService.Pages.Account.Reset;

public class Index : PageModel
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<Index> _logger;

    public Index(UserManager<ApplicationUser> userManager, ILogger<Index> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    [BindProperty]
    public InputModel Input { get; set; }

    public bool Done { get; private set; }

    public IActionResult OnGet(string email, string token)
    {
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(token))
        {
            return RedirectToPage("/Account/Forgot/Index");
        }

        Input = new InputModel { Email = email, Token = token };
        return Page();
    }

    public async Task<IActionResult> OnPost()
    {
        if (!ModelState.IsValid) return Page();

        var user = await _userManager.FindByEmailAsync(Input.Email);
        if (user == null)
        {
            // Do not reveal whether the account exists.
            Done = true;
            return Page();
        }

        var result = await _userManager.ResetPasswordAsync(user, Input.Token, Input.Password);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }
            return Page();
        }

        // Invalidate lockout counters after a successful reset.
        await _userManager.ResetAccessFailedCountAsync(user);

        _logger.LogInformation("SECURITY password_reset_completed user={User}", user.UserName);
        Done = true;
        return Page();
    }

    public class InputModel
    {
        [Required]
        public string Email { get; set; }

        [Required]
        public string Token { get; set; }

        [Required]
        [MinLength(10, ErrorMessage = "Password must be at least 10 characters.")]
        [MaxLength(128)]
        public string Password { get; set; }

        [Required]
        [Compare(nameof(Password), ErrorMessage = "Passwords do not match.")]
        public string ConfirmPassword { get; set; }
    }
}
