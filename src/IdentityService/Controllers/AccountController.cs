using System.Security.Claims;
using IdentityModel;
using IdentityService.DTOs;
using IdentityService.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace IdentityService.Controllers;

[ApiController]
[Route("api/account")]
public class AccountController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public AccountController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpPost("register")]
    public async Task<IActionResult> RegisterUser(RegisterDto registerDto)
    {
        var user = new ApplicationUser
        {
            UserName = registerDto.Username,
            Email = registerDto.Email,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, registerDto.Password);

        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        await _userManager.AddClaimsAsync(user, new Claim[]
        {
            new Claim(JwtClaimTypes.Name, registerDto.FullName)
        });
        await _userManager.AddToRoleAsync(user, "User");

        return Ok(new { user.Id, user.UserName, user.Email });
    }
}
