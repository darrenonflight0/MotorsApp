using IdentityModel;
using IdentityService.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace IdentityService.Controllers;

[ApiController]
[Route("api/profile")]
public class ProfileController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private const int MaxImageChars = 3_000_000;

    public ProfileController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    /// <summary>Public profile — used to render the blue tick / verified badge and
    /// avatar next to a seller's name anywhere in the app.</summary>
    [AllowAnonymous]
    [HttpGet("{username}")]
    public async Task<IActionResult> Get(string username)
    {
        var user = await _userManager.FindByNameAsync(username);
        if (user == null) return NotFound();

        var claims = await _userManager.GetClaimsAsync(user);
        var name = claims.FirstOrDefault(c => c.Type == JwtClaimTypes.Name)?.Value ?? user.UserName;

        return Ok(new
        {
            username = user.UserName,
            name,
            verified = user.IsVerified,
            profilePicture = user.ProfilePicture,
        });
    }

    public record PictureDto(string ProfilePicture);

    /// <summary>Set the caller's own profile picture (data URI).</summary>
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [HttpPost("me/picture")]
    public async Task<IActionResult> SetPicture([FromBody] PictureDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto?.ProfilePicture)
            || !dto.ProfilePicture.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "A captured or uploaded image is required." });
        if (dto.ProfilePicture.Length > MaxImageChars)
            return BadRequest(new { error = "Image is too large." });

        var user = await _userManager.FindByNameAsync(User.Identity!.Name);
        if (user == null) return Unauthorized();

        user.ProfilePicture = dto.ProfilePicture;
        await _userManager.UpdateAsync(user);
        return Ok(new { profilePicture = user.ProfilePicture });
    }
}
