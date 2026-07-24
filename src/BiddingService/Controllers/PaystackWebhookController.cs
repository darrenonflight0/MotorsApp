using System.Text;
using System.Text.Json;
using BiddingService.Models;
using BiddingService.Services.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Entities;

namespace BiddingService.Controllers;

/// <summary>
/// Receives Paystack webhooks. Webhooks are the reliable source of truth for
/// payment state — the browser callback can be lost, blocked, or spoofed, so we
/// confirm the deposit here after verifying Paystack's HMAC-SHA512 signature.
/// Authentication is the signature (Paystack is not a logged-in user), so the
/// endpoint is anonymous but rejects anything not signed with our secret key.
/// </summary>
[ApiController]
[Route("api/payments/paystack")]
[AllowAnonymous]
public class PaystackWebhookController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly ILogger<PaystackWebhookController> _logger;

    public PaystackWebhookController(IConfiguration config, ILogger<PaystackWebhookController> logger)
    {
        _config = config;
        _logger = logger;
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var secretKey = _config["Payments:Paystack:SecretKey"];
        if (string.IsNullOrWhiteSpace(secretKey))
        {
            _logger.LogWarning("PAYMENT paystack_webhook_unconfigured");
            return StatusCode(StatusCodes.Status503ServiceUnavailable);
        }

        // The signature is computed over the exact raw bytes, so read the body verbatim.
        string body;
        using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
        {
            body = await reader.ReadToEndAsync();
        }

        var signature = Request.Headers["x-paystack-signature"].ToString();
        if (!PaystackSignature.Verify(body, signature, secretKey))
        {
            _logger.LogWarning("PAYMENT paystack_webhook_bad_signature");
            return Unauthorized();
        }

        // Acknowledge fast; only act on successful charges.
        PaystackEvent evt;
        try
        {
            evt = ParseEvent(body);
        }
        catch
        {
            return Ok(); // Malformed but signed — nothing to do, don't trigger retries.
        }

        if (evt.Event == "charge.success" && !string.IsNullOrEmpty(evt.AuctionId))
        {
            await ConfirmDeposit(evt);
        }

        return Ok();
    }

    private async Task ConfirmDeposit(PaystackEvent evt)
    {
        var escrow = await DB.Find<Escrow>()
            .Match(e => e.AuctionId == evt.AuctionId)
            .ExecuteFirstAsync();

        if (escrow == null)
        {
            _logger.LogWarning("PAYMENT paystack_webhook_no_escrow auction={Auction}", evt.AuctionId);
            return;
        }

        // Idempotent: a webhook may be delivered more than once, and the browser
        // callback may already have funded the escrow.
        if (escrow.Status != EscrowStatus.AwaitingDeposit)
        {
            return;
        }

        if (evt.Status != "success" || evt.Amount < escrow.Amount * 100L)
        {
            _logger.LogWarning("PAYMENT paystack_webhook_amount_mismatch auction={Auction}", evt.AuctionId);
            return;
        }

        escrow.Status = EscrowStatus.Funded;
        escrow.FundedAt = DateTime.UtcNow;
        escrow.PaymentProvider = "Paystack";
        escrow.DepositReference = evt.Reference;
        escrow.Audit("paystack-webhook", $"deposit confirmed via webhook (ref {evt.Reference})");
        await DB.SaveAsync(escrow);

        _logger.LogInformation("PAYMENT paystack_webhook_funded auction={Auction} ref={Ref}",
            evt.AuctionId, evt.Reference);
    }

    private static PaystackEvent ParseEvent(string body)
    {
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        var data = root.GetProperty("data");

        string auctionId = null;
        if (data.TryGetProperty("metadata", out var meta) && meta.ValueKind == JsonValueKind.Object
            && meta.TryGetProperty("auctionId", out var aid))
        {
            auctionId = aid.GetString();
        }

        return new PaystackEvent
        {
            Event = root.TryGetProperty("event", out var e) ? e.GetString() : null,
            Reference = data.TryGetProperty("reference", out var r) ? r.GetString() : null,
            Status = data.TryGetProperty("status", out var s) ? s.GetString() : null,
            Amount = data.TryGetProperty("amount", out var a) && a.TryGetInt64(out var amt) ? amt : 0,
            AuctionId = auctionId,
        };
    }

    private sealed class PaystackEvent
    {
        public string Event { get; init; }
        public string Reference { get; init; }
        public string Status { get; init; }
        public long Amount { get; init; }
        public string AuctionId { get; init; }
    }
}
