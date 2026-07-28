using System.ComponentModel.DataAnnotations;
using Duende.IdentityServer.Services;
using IdentityModel;
using IdentityService.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Security.Claims;

namespace IdentityService.Pages.Account.Register;

public class Index : PageModel
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IIdentityServerInteractionService _interaction;
    private readonly ILogger<Index> _logger;

    public Index(UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IIdentityServerInteractionService interaction,
        ILogger<Index> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _interaction = interaction;
        _logger = logger;
    }

    [BindProperty]
    public InputModel Input { get; set; }

    public IActionResult OnGet(string returnUrl)
    {
        Input = new InputModel { ReturnUrl = returnUrl };
        return Page();
    }

    public async Task<IActionResult> OnPost()
    {
        if (!ModelState.IsValid) return Page();

        var user = new ApplicationUser
        {
            UserName = Input.Username,
            Email = Input.Email,
            EmailConfirmed = true,
            ProfilePicture = Input.ProfilePicture,
        };

        var result = await _userManager.CreateAsync(user, Input.Password);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }
            return Page();
        }

        await _userManager.AddClaimAsync(user, new Claim(JwtClaimTypes.Name, Input.FullName));
        await _userManager.AddToRoleAsync(user, "User");

        _logger.LogInformation("SECURITY user_registered user={User}", user.UserName);

        await _signInManager.SignInAsync(user, isPersistent: false);

        if (_interaction.IsValidReturnUrl(Input.ReturnUrl) || Url.IsLocalUrl(Input.ReturnUrl))
        {
            return Redirect(Input.ReturnUrl);
        }

        return Redirect("~/");
    }

    public class InputModel
    {
        [Required]
        [MaxLength(128)]
        [Display(Name = "Full name")]
        public string FullName { get; set; }

        [Required]
        [MaxLength(64)]
        [RegularExpression("^[a-zA-Z0-9_.-]+$",
            ErrorMessage = "Username may only contain letters, numbers, dots, dashes and underscores.")]
        public string Username { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(256)]
        public string Email { get; set; }

        [Required]
        [MinLength(10, ErrorMessage = "Password must be at least 10 characters.")]
        [MaxLength(128)]
        public string Password { get; set; }

        [Required]
        [Compare(nameof(Password), ErrorMessage = "Passwords do not match.")]
        [Display(Name = "Confirm password")]
        public string ConfirmPassword { get; set; }

        // A profile photo (data URI) chosen and compressed client-side.
        [Required(ErrorMessage = "Please add a profile picture.")]
        [MaxLength(3_000_000)]
        public string ProfilePicture { get; set; }

        public string ReturnUrl { get; set; }
    }
}
