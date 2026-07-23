using BiddingService.Models;
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

    public EscrowController(ILogger<EscrowController> logger)
    {
        _logger = logger;
    }

    private string Username => User.Identity!.Name;
    private bool IsAdmin => User.IsInRole("Admin");

    private static object ToDto(Escrow e) => new
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

    /// <summary>Buyer pays the winning amount into escrow (simulated in development).</summary>
    [HttpPost("{auctionId}/deposit")]
    public async Task<ActionResult> Deposit(string auctionId)
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

        escrow.Status = EscrowStatus.Funded;
        escrow.FundedAt = DateTime.UtcNow;
        escrow.Audit(Username, "buyer deposited funds");
        await DB.SaveAsync(escrow);

        _logger.LogInformation("SECURITY escrow_funded auction={Auction} buyer={Buyer} amount={Amount}",
            auctionId, Username, escrow.Amount);
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

        escrow.Status = EscrowStatus.Released;
        escrow.ClosedAt = DateTime.UtcNow;
        escrow.Audit(Username, "buyer confirmed delivery; funds released to seller");
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

        escrow.Status = outcome == "release" ? EscrowStatus.Released : EscrowStatus.Refunded;
        escrow.ClosedAt = DateTime.UtcNow;
        escrow.Audit(Username, $"admin resolved dispute: {outcome}");
        await DB.SaveAsync(escrow);

        _logger.LogWarning("SECURITY escrow_resolved auction={Auction} outcome={Outcome} admin={Admin}",
            auctionId, outcome, Username);
        return Ok(ToDto(escrow));
    }

    private static Task<Escrow> FindEscrow(string auctionId) =>
        DB.Find<Escrow>().Match(e => e.AuctionId == auctionId).ExecuteFirstAsync();
}
