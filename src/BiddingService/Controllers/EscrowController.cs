using BiddingService.Models;
using BiddingService.Services.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Entities;

namespace BiddingService.Controllers;

[ApiController]
[Route("api/escrow")]
[Authorize]
public class EscrowController : ControllerBase
{
    private readonly ILogger<EscrowController> _logger;
    private readonly IEscrowPaymentProvider _payments;

    public EscrowController(ILogger<EscrowController> logger, IEscrowPaymentProvider payments)
    {
        _logger = logger;
        _payments = payments;
    }

    private string Username => User.Identity!.Name;
    private bool IsAdmin => User.IsInRole("Admin");

    private object ToDto(Escrow e) => new
    {
        id = e.ID,
        auctionId = e.AuctionId,
        seller = e.Seller,
        buyer = e.Buyer,
        amount = e.Amount,
        status = e.Status.ToString(),
        createdAt = e.CreatedAt,
        fundedAt = e.FundedAt,
        closedAt = e.ClosedAt,
        paymentProvider = e.PaymentProvider,
        // Lets the UI clearly disclose when funds are simulated rather than real.
        fundsAreReal = _payments.HandlesRealFunds,
    };

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

    private static Task<Escrow> FindEscrow(string auctionId) =>
        DB.Find<Escrow>().Match(e => e.AuctionId == auctionId).ExecuteFirstAsync();
}
