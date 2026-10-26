using BiddingService.Models;
using Contracts;
using MassTransit;
using BiddingService.Services;
using BiddingService.Services.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MongoDB.Entities;

namespace BiddingService.Controllers;

[ApiController]
[Route("api/escrow")]
[Authorize]
public class EscrowController : ControllerBase
{
    private readonly ILogger<EscrowController> _logger;
    private readonly IEscrowPaymentProvider _payments;
    private readonly IConfiguration _config;
    private readonly IPublishEndpoint _publish;

    public EscrowController(ILogger<EscrowController> logger, IEscrowPaymentProvider payments,
        IConfiguration config, IPublishEndpoint publish)
    {
        _logger = logger;
        _payments = payments;
        _config = config;
        _publish = publish;
    }

    private string Username => User.Identity!.Name;
    private bool IsAdmin => User.IsInRole("Admin");

    private object ToDto(Escrow e)
    {
        var percent = PlatformFees.BuyerPremiumPercent(_config);
        var premium = PlatformFees.Premium(e.Amount, percent);
        return new
        {
            id = e.ID,
            auctionId = e.AuctionId,
            seller = e.Seller,
            buyer = e.Buyer,
            // Amount = the seller's proceeds (winning bid). The buyer pays `total`
            // (bid + buyer's premium); the platform keeps the premium.
            amount = e.Amount,
            buyerPremiumPercent = percent,
            buyerPremium = premium,
            total = e.Amount + premium,
            status = e.Status.ToString(),
            createdAt = e.CreatedAt,
            fundedAt = e.FundedAt,
            closedAt = e.ClosedAt,
            paymentProvider = e.PaymentProvider,
            // The currently-configured provider, so the UI can pick the right
            // checkout (e.g. Paystack) even before a deposit has been recorded.
            activeProvider = _payments.Name,
            // Lets the UI clearly disclose when funds are simulated rather than real.
            fundsAreReal = _payments.HandlesRealFunds,
            shipment = new
            {
                stage = e.ShipmentStage.ToString(),
                trackingRef = e.TrackingRef,
                updates = e.ShipmentUpdates
                    .OrderByDescending(u => u.At)
                    .Select(u => new { at = u.At, by = u.By, stage = u.Stage.ToString(), location = u.Location, note = u.Note }),
            },
        };
    }

    [HttpGet("{auctionId}")]
    public async Task<ActionResult> GetForAuction(string auctionId)
    {
        var escrow = await DB.Find<Escrow>()
            .Match(e => e.AuctionId == auctionId)
            .ExecuteFirstAsync();

        if (escrow == null) return NotFound();

        // Escrow details are private to the two parties and admins.
        if (escrow.Buyer != Username && escrow.Seller != Username && !IsAdmin)
        {
            _logger.LogWarning("SECURITY escrow_access_denied user={User} auction={Auction}",
                Username, auctionId);
            return Forbid();
        }

        return Ok(ToDto(escrow));
    }

    [HttpGet("mine")]
    public async Task<ActionResult> Mine()
    {
        var escrows = await DB.Find<Escrow>()
            .Match(e => e.Buyer == Username || e.Seller == Username)
            .Sort(b => b.Descending(e => e.CreatedAt))
            .ExecuteAsync();

        return Ok(escrows.Select(ToDto));
    }

    /// <summary>Admin: every disputed escrow awaiting resolution.</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("admin/disputed")]
    public async Task<ActionResult> Disputed()
    {
        var escrows = await DB.Find<Escrow>()
            .Match(e => e.Status == EscrowStatus.Disputed)
            .Sort(b => b.Ascending(e => e.CreatedAt))
            .ExecuteAsync();

        return Ok(escrows.Select(ToDto));
    }

    /// <summary>Admin: all escrows, newest first (for oversight).</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("admin/all")]
    public async Task<ActionResult> All()
    {
        var escrows = await DB.Find<Escrow>()
            .Sort(b => b.Descending(e => e.CreatedAt))
            .ExecuteAsync();

        return Ok(escrows.Select(ToDto));
    }

    /// <summary>
    /// Buyer pays the winning amount into escrow. The money movement runs through
    /// the configured payment provider (real Stripe capture in production, a
    /// simulation in development). <paramref name="paymentReference"/> carries the
    /// provider token (e.g. a Stripe PaymentIntent id) when required.
    /// </summary>
    [HttpPost("{auctionId}/deposit")]
    public async Task<ActionResult> Deposit(string auctionId, [FromQuery] string paymentReference = null)
    {
        var escrow = await FindEscrow(auctionId);
        if (escrow == null) return NotFound();

        if (escrow.Buyer != Username)
        {
            _logger.LogWarning("SECURITY escrow_deposit_denied user={User} auction={Auction}",
                Username, auctionId);
            return Forbid();
        }

        if (escrow.Status != EscrowStatus.AwaitingDeposit)
        {
            return BadRequest($"Cannot deposit while escrow is {escrow.Status}");
        }

        var payment = await _payments.CaptureDepositAsync(escrow, paymentReference);
        if (!payment.Success)
        {
            _logger.LogWarning("PAYMENT deposit_failed auction={Auction} reason={Reason}", auctionId, payment.Message);
            return StatusCode(StatusCodes.Status402PaymentRequired, new { error = payment.Message });
        }

        escrow.Status = EscrowStatus.Funded;
        escrow.FundedAt = DateTime.UtcNow;
        escrow.PaymentProvider = _payments.Name;
        escrow.DepositReference = payment.ProviderReference;
        escrow.Audit(Username, $"buyer deposited funds via {_payments.Name} (ref {payment.ProviderReference})");
        await DB.SaveAsync(escrow);

        // The winner has paid the full amount into escrow, so their refundable
        // bid deposit is no longer needed — return it.
        await RefundBidDeposit(auctionId, escrow.Buyer);

        await Notify(auctionId, escrow.Buyer, "Funded", "Payment received. Your funds are held in escrow; the seller will post shipping updates here.");
        await Notify(auctionId, escrow.Seller, "Funded", "The buyer has paid into escrow. Prepare the car and post a shipping update.");

        _logger.LogInformation("SECURITY escrow_funded auction={Auction} buyer={Buyer} amount={Amount} provider={Provider}",
            auctionId, Username, escrow.Amount, _payments.Name);
        return Ok(ToDto(escrow));
    }

    /// <summary>Buyer confirms delivery; platform releases funds to the seller.</summary>
    [HttpPost("{auctionId}/confirm-delivery")]
    public async Task<ActionResult> ConfirmDelivery(string auctionId)
    {
        var escrow = await FindEscrow(auctionId);
        if (escrow == null) return NotFound();

        if (escrow.Buyer != Username)
        {
            _logger.LogWarning("SECURITY escrow_release_denied user={User} auction={Auction}",
                Username, auctionId);
            return Forbid();
        }

        if (escrow.Status != EscrowStatus.Funded)
        {
            return BadRequest($"Cannot release while escrow is {escrow.Status}");
        }

        await ResolveSellerPayoutAccount(escrow);
        var payout = await _payments.ReleaseToSellerAsync(escrow);
        if (!payout.Success)
        {
            _logger.LogWarning("PAYMENT release_failed auction={Auction} reason={Reason}", auctionId, payout.Message);
            return StatusCode(StatusCodes.Status402PaymentRequired, new { error = payout.Message });
        }

        escrow.Status = EscrowStatus.Released;
        escrow.ClosedAt = DateTime.UtcNow;
        escrow.PayoutReference = payout.ProviderReference;
        escrow.Audit(Username, $"buyer confirmed delivery; funds released to seller (ref {payout.ProviderReference})");
        await DB.SaveAsync(escrow);

        _logger.LogInformation("SECURITY escrow_released auction={Auction} seller={Seller} amount={Amount}",
            auctionId, escrow.Seller, escrow.Amount);
        return Ok(ToDto(escrow));
    }

    /// <summary>Either party can freeze a funded escrow for admin review.</summary>
    [HttpPost("{auctionId}/dispute")]
    public async Task<ActionResult> Dispute(string auctionId)
    {
        var escrow = await FindEscrow(auctionId);
        if (escrow == null) return NotFound();

        if (escrow.Buyer != Username && escrow.Seller != Username)
        {
            return Forbid();
        }

        if (escrow.Status != EscrowStatus.Funded)
        {
            return BadRequest($"Cannot dispute while escrow is {escrow.Status}");
        }

        escrow.Status = EscrowStatus.Disputed;
        escrow.Audit(Username, "dispute opened");
        await DB.SaveAsync(escrow);

        _logger.LogWarning("SECURITY escrow_disputed auction={Auction} by={User}", auctionId, Username);
        return Ok(ToDto(escrow));
    }

    /// <summary>Admin-only dispute resolution: release to seller or refund the buyer.</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("{auctionId}/resolve")]
    public async Task<ActionResult> Resolve(string auctionId, [FromQuery] string outcome)
    {
        if (outcome != "release" && outcome != "refund")
        {
            return BadRequest("outcome must be 'release' or 'refund'");
        }

        var escrow = await FindEscrow(auctionId);
        if (escrow == null) return NotFound();

        if (escrow.Status != EscrowStatus.Disputed)
        {
            return BadRequest($"Cannot resolve while escrow is {escrow.Status}");
        }

        if (outcome == "release") await ResolveSellerPayoutAccount(escrow);
        var settlement = outcome == "release"
            ? await _payments.ReleaseToSellerAsync(escrow)
            : await _payments.RefundBuyerAsync(escrow);
        if (!settlement.Success)
        {
            _logger.LogWarning("PAYMENT resolve_failed auction={Auction} outcome={Outcome} reason={Reason}",
                auctionId, outcome, settlement.Message);
            return StatusCode(StatusCodes.Status402PaymentRequired, new { error = settlement.Message });
        }

        escrow.Status = outcome == "release" ? EscrowStatus.Released : EscrowStatus.Refunded;
        escrow.ClosedAt = DateTime.UtcNow;
        escrow.PayoutReference = settlement.ProviderReference;
        escrow.Audit(Username, $"admin resolved dispute: {outcome} (ref {settlement.ProviderReference})");
        await DB.SaveAsync(escrow);

        _logger.LogWarning("SECURITY escrow_resolved auction={Auction} outcome={Outcome} admin={Admin}",
            auctionId, outcome, Username);
        return Ok(ToDto(escrow));
    }

    public record ShipmentUpdateDto(string Stage, string Location, string TrackingRef, string Note);

    /// <summary>
    /// Seller (or an admin) posts a shipping update on a funded escrow: the stage
    /// moves forward only, with the car's current location and an optional
    /// tracking reference. The buyer is notified.
    /// </summary>
    [HttpPost("{auctionId}/shipment")]
    public async Task<ActionResult> PostShipment(string auctionId, [FromBody] ShipmentUpdateDto dto)
    {
        var escrow = await FindEscrow(auctionId);
        if (escrow == null) return NotFound();

        if (escrow.Seller != Username && !IsAdmin)
        {
            _logger.LogWarning("SECURITY shipment_update_denied user={User} auction={Auction}", Username, auctionId);
            return Forbid();
        }

        if (escrow.Status != EscrowStatus.Funded)
            return BadRequest($"Shipping updates can only be posted while funds are held (escrow is {escrow.Status}).");

        if (dto == null || !Enum.TryParse<ShipmentStage>(dto.Stage, true, out var stage) || !Enum.IsDefined(stage))
            return BadRequest("Choose a valid shipping stage.");

        if (stage < escrow.ShipmentStage)
            return BadRequest($"The shipment is already at '{escrow.ShipmentStage}'; stages can't move backwards.");

        var location = Clean(dto.Location, 120);
        var note = Clean(dto.Note, 500);
        var tracking = Clean(dto.TrackingRef, 80);
        if (string.IsNullOrEmpty(location) && string.IsNullOrEmpty(note) && stage == escrow.ShipmentStage)
            return BadRequest("Add a location or a note.");

        escrow.ShipmentStage = stage;
        if (!string.IsNullOrEmpty(tracking)) escrow.TrackingRef = tracking;
        escrow.ShipmentUpdates.Add(new ShipmentUpdate { By = Username, Stage = stage, Location = location, Note = note });
        escrow.Audit(Username, $"shipment update: {stage}{(string.IsNullOrEmpty(location) ? "" : " @ " + location)}");
        await DB.SaveAsync(escrow);

        var where = string.IsNullOrEmpty(location) ? "" : $" ({location})";
        await Notify(auctionId, escrow.Buyer, "Shipment", $"Shipping update: {StageLabel(stage)}{where}");

        _logger.LogInformation("SHIPMENT update auction={Auction} stage={Stage} by={User}", auctionId, stage, Username);
        return Ok(ToDto(escrow));
    }

    /// <summary>The buyer/seller message thread for a sale (parties and admins only).</summary>
    [HttpGet("{auctionId}/messages")]
    public async Task<ActionResult> GetMessages(string auctionId)
    {
        var escrow = await FindEscrow(auctionId);
        if (escrow == null) return NotFound();
        if (escrow.Buyer != Username && escrow.Seller != Username && !IsAdmin) return Forbid();

        return Ok(escrow.Messages.Select(m => new { at = m.At, from = m.From, text = m.Text }));
    }

    public record MessageDto(string Text);

    /// <summary>Buyer or seller sends a message to the other party about this sale.</summary>
    [HttpPost("{auctionId}/messages")]
    public async Task<ActionResult> PostMessage(string auctionId, [FromBody] MessageDto dto)
    {
        var escrow = await FindEscrow(auctionId);
        if (escrow == null) return NotFound();

        if (escrow.Buyer != Username && escrow.Seller != Username)
        {
            _logger.LogWarning("SECURITY escrow_message_denied user={User} auction={Auction}", Username, auctionId);
            return Forbid();
        }

        if (escrow.Status != EscrowStatus.Funded && escrow.Status != EscrowStatus.Disputed)
            return BadRequest($"Messaging is open while a sale is in progress (escrow is {escrow.Status}).");

        var text = Clean(dto?.Text, 1000);
        if (string.IsNullOrEmpty(text)) return BadRequest("Write a message first.");

        escrow.Messages.Add(new EscrowMessage { From = Username, Text = text });
        if (escrow.Messages.Count > 200) escrow.Messages.RemoveRange(0, escrow.Messages.Count - 200);
        await DB.SaveAsync(escrow);

        var other = Username == escrow.Buyer ? escrow.Seller : escrow.Buyer;
        await Notify(auctionId, other, "Message", $"New message from {Username} about your sale");

        return Ok(escrow.Messages.Select(m => new { at = m.At, from = m.From, text = m.Text }));
    }

    private static string Clean(string value, int max)
    {
        var v = value?.Trim();
        if (string.IsNullOrEmpty(v)) return null;
        return v.Length > max ? v[..max] : v;
    }

    private static string StageLabel(ShipmentStage s) => s switch
    {
        ShipmentStage.Preparing => "preparing for shipment",
        ShipmentStage.Collected => "car collected",
        ShipmentStage.AtPort => "at port",
        ShipmentStage.Loaded => "loaded on vessel",
        ShipmentStage.InTransit => "in transit",
        ShipmentStage.Arrived => "arrived at destination",
        _ => s.ToString(),
    };

    // Best-effort real-time alert; a failed publish must never fail the action.
    private async Task Notify(string auctionId, string recipient, string kind, string message)
    {
        try
        {
            await _publish.Publish(new EscrowActivity
            {
                AuctionId = auctionId, Recipient = recipient, Kind = kind, Message = message,
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "escrow_activity publish failed auction={Auction} kind={Kind}", auctionId, kind);
        }
    }

    private static Task<Escrow> FindEscrow(string auctionId) =>
        DB.Find<Escrow>().Match(e => e.AuctionId == auctionId).ExecuteFirstAsync();

    // Populate the payout destination from the seller's registered payout method
    // (set once, in Payouts). Real providers refuse to release without it; the
    // simulated provider ignores it. Already-set accounts are left untouched.
    private static async Task ResolveSellerPayoutAccount(Escrow escrow)
    {
        if (!string.IsNullOrWhiteSpace(escrow.SellerPayoutAccount)) return;
        var method = await DB.Find<PayoutMethod>()
            .Match(m => m.Seller == escrow.Seller)
            .ExecuteFirstAsync();
        if (method != null) escrow.SellerPayoutAccount = method.RecipientCode;
    }

    // Return a bidder's held refundable bid deposit for an auction (no-op if none).
    private async Task RefundBidDeposit(string auctionId, string bidder)
    {
        var deposit = await DB.Find<BidDeposit>()
            .Match(d => d.AuctionId == auctionId && d.Bidder == bidder && d.Status == BidDepositStatus.Held)
            .ExecuteFirstAsync();
        if (deposit == null) return;

        var refund = await _payments.RefundPaymentAsync(deposit.PaymentReference);
        deposit.Status = BidDepositStatus.Refunded;
        deposit.RefundReference = refund.ProviderReference;
        deposit.ClosedAt = DateTime.UtcNow;
        await DB.SaveAsync(deposit);
        _logger.LogInformation("SECURITY bid_deposit_refunded_on_funding auction={Auction} bidder={Bidder} ok={Ok}",
            auctionId, bidder, refund.Success);
    }
}
