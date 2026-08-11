using System.Net;
using System.Net.Mail;

namespace IdentityService.Services;

public interface IAppEmailSender
{
    Task SendAsync(string to, string subject, string htmlBody);
}

/// <summary>
/// SMTP-backed sender used when Smtp:Host is configured; otherwise falls back to
/// logging the message so password-reset links remain usable in development.
/// Security note: outgoing mail never asks for passwords or payment details.
/// </summary>
public class EmailSender : IAppEmailSender
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailSender> _logger;

    public EmailSender(IConfiguration config, ILogger<EmailSender> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string htmlBody)
    {
        var host = _config["Smtp:Host"];

        if (string.IsNullOrEmpty(host))
        {
            // Never log the body — it can contain password-reset links/tokens.
            _logger.LogWarning(
                "SMTP not configured — email to {To} ({Subject}) was NOT sent. Configure Smtp:Host.",
                to, subject);
            return;
        }

        using var client = new SmtpClient(host, _config.GetValue("Smtp:Port", 587))
        {
            EnableSsl = _config.GetValue("Smtp:UseSsl", true),
        };

        var username = _config["Smtp:Username"];
        if (!string.IsNullOrEmpty(username))
        {
            client.Credentials = new NetworkCredential(username, _config["Smtp:Password"]);
        }

        var from = _config["Smtp:From"] ?? "no-reply@yamkela.local";
        using var message = new MailMessage(from, to, subject, htmlBody) { IsBodyHtml = true };
        await client.SendMailAsync(message);
    }
}
