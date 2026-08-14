namespace Contracts;

/// <summary>
/// A platform-wide announcement an admin sends to every user (new lots, notices,
/// important information). The NotificationService relays it over SignalR.
/// </summary>
public class AnnouncementBroadcast
{
    public string Title { get; set; }
    public string Message { get; set; }
    public string Href { get; set; }   // optional deep link
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
