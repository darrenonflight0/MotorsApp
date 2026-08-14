using Contracts;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BiddingService.Controllers;

/// <summary>
/// Admin broadcast: publishes a platform-wide announcement that the
/// NotificationService relays to every connected user over SignalR.
/// </summary>
[ApiController]
[Route("api/announcements")]
[Authorize(Roles = "Admin")]
public class AnnouncementController : ControllerBase
{
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<AnnouncementController> _logger;

    public AnnouncementController(IPublishEndpoint publishEndpoint, ILogger<AnnouncementController> logger)
    {
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public record AnnouncementDto(string Title, string Message, string Href);

    [HttpPost]
    public async Task<ActionResult> Send([FromBody] AnnouncementDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest("A message is required.");

        var announcement = new AnnouncementBroadcast
        {
            Title = string.IsNullOrWhiteSpace(dto.Title) ? "Announcement" : dto.Title.Trim(),
            Message = dto.Message.Trim(),
            Href = string.IsNullOrWhiteSpace(dto.Href) ? null : dto.Href.Trim(),
        };
        await _publishEndpoint.Publish(announcement);

        _logger.LogInformation("SECURITY announcement_sent admin={Admin} title={Title}",
            User.Identity?.Name, announcement.Title);
        return Ok(new { sent = true });
    }
}
