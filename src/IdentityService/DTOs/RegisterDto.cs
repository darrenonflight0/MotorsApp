using System.ComponentModel.DataAnnotations;

namespace IdentityService.DTOs;

public class RegisterDto
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; }

    [Required]
    [MaxLength(64)]
    [RegularExpression("^[a-zA-Z0-9_.-]+$",
        ErrorMessage = "Username may only contain letters, numbers, dots, dashes and underscores.")]
    public string Username { get; set; }

    [Required]
    [MinLength(10)]
    [MaxLength(128)]
    public string Password { get; set; }

    [Required]
    [MaxLength(128)]
    public string FullName { get; set; }
}
