using Microsoft.AspNetCore.Identity;

namespace IdentityService.Models;

public class ApplicationUser : IdentityUser
{
    /// <summary>True once an admin has approved the user's seller-verification
    /// application. Verified users get the blue tick and may list cars.</summary>
    public bool IsVerified { get; set; }

    /// <summary>Profile picture as a data URI (uploaded at sign-up or later).</summary>
    public string ProfilePicture { get; set; }
}
