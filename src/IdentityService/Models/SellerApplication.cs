using System.ComponentModel.DataAnnotations;

namespace IdentityService.Models;

public enum SellerApplicationStatus
{
    Pending,
    Approved,
    Rejected,
}

/// <summary>
/// A user's application to become a verified auctioneer. Captures the live
/// selfie and ID document (as data URIs) for the admin's manual review. On
/// approval the applicant's <see cref="ApplicationUser.IsVerified"/> is set.
/// </summary>
public class SellerApplication
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string Username { get; set; }

    /// <summary>"Passport" or "Driver's License".</summary>
    public string IdType { get; set; }

    /// <summary>Live selfie, data URI (image/*).</summary>
    public string SelfieImage { get; set; }

    /// <summary>Photo of the official ID, data URI (image/*).</summary>
    public string IdImage { get; set; }

    public SellerApplicationStatus Status { get; set; } = SellerApplicationStatus.Pending;

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public string ReviewedBy { get; set; }
    public string RejectionReason { get; set; }
}
