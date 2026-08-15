using System.ComponentModel.DataAnnotations;
using IdentityService.Data;
using IdentityService.Models;
using IdentityService.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Controllers;

[ApiController]
[Route("api/verification")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class VerificationController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly DataEncryptor _enc;
    private readonly ILogger<VerificationController> _logger;

    // Data URIs are capped so a captured photo can't bloat the request. The
    // frontend downscales images before upload, so this is a generous ceiling.
    private const int MaxImageChars = 3_000_000; // ~2 MB encoded

    public VerificationController(ApplicationDbContext db,
        UserManager<ApplicationUser> userManager, DataEncryptor enc,
        ILogger<VerificationController> logger)
    {
        _db = db;
        _userManager = userManager;
        _enc = enc;
        _logger = logger;
    }

    private string Username => User.Identity!.Name;

    public record ApplyDto(string IdType, string SelfieImage, string IdImage);

    private static object ToStatusDto(SellerApplication a) => new
    {
        id = a.Id,
        username = a.Username,
        idType = a.IdType,
        status = a.Status.ToString(),
        submittedAt = a.SubmittedAt,
        reviewedAt = a.ReviewedAt,
        reviewedBy = a.ReviewedBy,
        rejectionReason = a.RejectionReason,
    };

    // Decrypts the stored images so the admin can view them during review.
    private object ToReviewDto(SellerApplication a) => new
    {
        id = a.Id,
        username = a.Username,
        idType = a.IdType,
        status = a.Status.ToString(),
        submittedAt = a.SubmittedAt,
        selfieImage = _enc.Decrypt(a.SelfieImage),
        idImage = _enc.Decrypt(a.IdImage),
    };

    /// <summary>Submit a seller-verification application (live selfie + ID photo).</summary>
    [HttpPost("apply")]
    public async Task<IActionResult> Apply([FromBody] ApplyDto dto)
    {
        var user = await _userManager.FindByNameAsync(Username);
        if (user == null) return Unauthorized();
        if (user.IsVerified) return BadRequest(new { error = "You are already a verified auctioneer." });

        if (string.IsNullOrWhiteSpace(dto.SelfieImage) || string.IsNullOrWhiteSpace(dto.IdImage))
            return BadRequest(new { error = "Both a selfie and an ID photo are required." });
        if (!IsImageDataUri(dto.SelfieImage) || !IsImageDataUri(dto.IdImage))
            return BadRequest(new { error = "Images must be captured photos." });
        if (dto.SelfieImage.Length > MaxImageChars || dto.IdImage.Length > MaxImageChars)
            return BadRequest(new { error = "An image is too large." });

        var hasPending = await _db.SellerApplications
            .AnyAsync(a => a.Username == Username && a.Status == SellerApplicationStatus.Pending);
        if (hasPending) return BadRequest(new { error = "You already have an application under review." });

        var application = new SellerApplication
        {
            Username = Username,
            IdType = dto.IdType,
            // Encrypted at rest — decrypted only when an admin reviews.
            SelfieImage = _enc.Encrypt(dto.SelfieImage),
            IdImage = _enc.Encrypt(dto.IdImage),
        };
        _db.SellerApplications.Add(application);
        await _db.SaveChangesAsync();

        _logger.LogInformation("SECURITY seller_application_submitted user={User}", Username);
        return Ok(ToStatusDto(application));
    }

    /// <summary>The caller's verification status + latest application.</summary>
    [HttpGet("mine")]
    public async Task<IActionResult> Mine()
    {
        var user = await _userManager.FindByNameAsync(Username);
        if (user == null) return Unauthorized();

        var latest = await _db.SellerApplications
            .Where(a => a.Username == Username)
            .OrderByDescending(a => a.SubmittedAt)
            .FirstOrDefaultAsync();

        return Ok(new
        {
            verified = user.IsVerified,
            application = latest == null ? null : ToStatusDto(latest),
        });
    }

    /// <summary>Admin: every pending application (with images) to review.</summary>
    [Authorize(Roles = "Admin", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [HttpGet("admin/pending")]
    public async Task<IActionResult> Pending()
    {
        var pending = await _db.SellerApplications
            .Where(a => a.Status == SellerApplicationStatus.Pending)
            .OrderBy(a => a.SubmittedAt)
            .ToListAsync();

        return Ok(pending.Select(ToReviewDto));
    }

    [Authorize(Roles = "Admin", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [HttpPost("admin/{id}/approve")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var application = await _db.SellerApplications.FindAsync(id);
        if (application == null) return NotFound();
        if (application.Status != SellerApplicationStatus.Pending)
            return BadRequest(new { error = "Application already reviewed." });

        application.Status = SellerApplicationStatus.Approved;
        application.ReviewedAt = DateTime.UtcNow;
        application.ReviewedBy = Username;

        var user = await _userManager.FindByNameAsync(application.Username);
        if (user != null)
        {
            user.IsVerified = true;
            await _userManager.UpdateAsync(user);
        }
        await _db.SaveChangesAsync();

        _logger.LogInformation("SECURITY seller_application_approved user={User} admin={Admin}",
            application.Username, Username);
        return Ok(ToStatusDto(application));
    }

    public record RejectDto(string Reason);

    [Authorize(Roles = "Admin", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [HttpPost("admin/{id}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectDto dto)
    {
        var application = await _db.SellerApplications.FindAsync(id);
        if (application == null) return NotFound();
        if (application.Status != SellerApplicationStatus.Pending)
            return BadRequest(new { error = "Application already reviewed." });

        application.Status = SellerApplicationStatus.Rejected;
        application.ReviewedAt = DateTime.UtcNow;
        application.ReviewedBy = Username;
        application.RejectionReason = string.IsNullOrWhiteSpace(dto?.Reason) ? "Did not meet verification requirements." : dto.Reason;
        await _db.SaveChangesAsync();

        _logger.LogWarning("SECURITY seller_application_rejected user={User} admin={Admin}",
            application.Username, Username);
        return Ok(ToStatusDto(application));
    }

    /// <summary>Admin: list verified (authorised) users, optionally filtered by username.</summary>
    [Authorize(Roles = "Admin", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [HttpGet("admin/verified")]
    public async Task<IActionResult> VerifiedUsers([FromQuery] string q = null)
    {
        var query = _userManager.Users.Where(u => u.IsVerified);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(u => u.UserName.Contains(term));
        }

        var users = await query.OrderBy(u => u.UserName).Take(50).ToListAsync();
        return Ok(users.Select(u => new
        {
            username = u.UserName,
            verified = u.IsVerified,
            profilePicture = u.ProfilePicture,
        }));
    }

    /// <summary>Admin: revoke a user's seller authorisation (un-verify them).</summary>
    [Authorize(Roles = "Admin", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [HttpPost("admin/{username}/revoke")]
    public async Task<IActionResult> Revoke(string username)
    {
        var user = await _userManager.FindByNameAsync(username);
        if (user == null) return NotFound();
        if (!user.IsVerified) return BadRequest(new { error = "That user is not verified." });

        user.IsVerified = false;
        await _userManager.UpdateAsync(user);

        // Mark their approved application as rejected so a re-application starts clean.
        var approved = await _db.SellerApplications
            .Where(a => a.Username == username && a.Status == SellerApplicationStatus.Approved)
            .OrderByDescending(a => a.SubmittedAt)
            .FirstOrDefaultAsync();
        if (approved != null)
        {
            approved.Status = SellerApplicationStatus.Rejected;
            approved.ReviewedAt = DateTime.UtcNow;
            approved.ReviewedBy = Username;
            approved.RejectionReason = "Authorisation revoked by admin.";
            await _db.SaveChangesAsync();
        }

        _logger.LogWarning("SECURITY seller_verification_revoked user={User} admin={Admin}", username, Username);
        return Ok(new { username, verified = false });
    }

    private static bool IsImageDataUri(string s) =>
        !string.IsNullOrEmpty(s) && s.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase);
}
