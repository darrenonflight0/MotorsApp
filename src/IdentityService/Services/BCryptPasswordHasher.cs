using IdentityService.Models;
using Microsoft.AspNetCore.Identity;

namespace IdentityService.Services;

/// <summary>
/// BCrypt password hashing with a minimum work factor of 12.
/// Verifies legacy ASP.NET Identity (PBKDF2) hashes and signals a rehash so
/// existing accounts migrate to BCrypt transparently on their next login.
/// </summary>
public class BCryptPasswordHasher : IPasswordHasher<ApplicationUser>
{
    private const int WorkFactor = 12;

    private readonly PasswordHasher<ApplicationUser> _legacyHasher = new();

    public string HashPassword(ApplicationUser user, string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, workFactor: WorkFactor);
    }

    public PasswordVerificationResult VerifyHashedPassword(
        ApplicationUser user, string hashedPassword, string providedPassword)
    {
        if (hashedPassword.StartsWith("$2"))
        {
            if (!BCrypt.Net.BCrypt.Verify(providedPassword, hashedPassword))
            {
                return PasswordVerificationResult.Failed;
            }

            // Bump hashes created at a lower cost up to the current work factor.
            return BCrypt.Net.BCrypt.PasswordNeedsRehash(hashedPassword, WorkFactor)
                ? PasswordVerificationResult.SuccessRehashNeeded
                : PasswordVerificationResult.Success;
        }

        // Legacy PBKDF2 hash from the previous hasher: verify, then request rehash to BCrypt.
        var legacyResult = _legacyHasher.VerifyHashedPassword(user, hashedPassword, providedPassword);
        return legacyResult == PasswordVerificationResult.Failed
            ? PasswordVerificationResult.Failed
            : PasswordVerificationResult.SuccessRehashNeeded;
    }
}
