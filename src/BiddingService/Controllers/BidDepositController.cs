using BiddingService.Models;
using BiddingService.Services;
using BiddingService.Services.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Entities;

namespace BiddingService.Controllers;

/// <summary>
/// Refundable bid deposits. A bidder must hold a paid deposit for an auction
/// before their bids are accepted (see <see cref="BidsController"/>). The deposit
/// is returned when the bidder loses or when the winner funds the escrow, and is
/// forfeitable if the winner defaults.
/// </summary>
[ApiController]
[Route("api/biddeposits")]
[Authorize]
public class BidDepositController : ControllerBase
{
    private readonly ILogger<BidDepositController> _logger;
    private readonly IEscrowPaymentProvider _payments;
    private readonly IConfiguration _config;
    private readonly AuctionServiceHttpClient _auctionClient;

    public BidDepositController(ILogger<BidDepositController> logger, IEscrowPaymentProvider payments,
        IConfiguration config, AuctionServiceHttpClient auctionClient)
    {
        _logger = logger;
        _payments = payments;
        _config = config;
        _auctionClient = auctionClient;
    }

    private string Username => User.Identity!.Name;
    private string Currency => _config["Payments:Paystack:Currency"] ?? _config["Payments:Stripe:Currency"] ?? "";

    private static Task<BidDeposit> FindHeld(string auctionId, string bidder) =>
        DB.Find<BidDeposit>()
            .Match(d => d.AuctionId == auctionId && d.Bidder == bidder && d.Status == BidDepositStatus.Held)
            .ExecuteFirstAsync();

    /// <summary>Whether the caller needs (and holds) a bid deposit for this auction.</summary>
    [HttpGet("{auctionId}")]
    public async Task<ActionResult> Status(string auctionId)
    {
        var auction = await _auctionClient.GetOrFetchAuction(auctionId);
        if (auction == null) return NotFound("Auction not found");

        var enabled = BidDepositPolicy.Enabled(_config);
        var amount = enabled ? BidDepositPolicy.RequiredAmount(_config, auction.ReservePrice) : 0;
        var held = await FindHeld(auctionId, Username);

        return Ok(new
        {
            auctionId,
            required = enabled && amount > 0,
            amount,
            currency = Currency,
            held = held != null,
            status = held?.Status.ToString(),
            activeProvider = _payments.Name,
            fundsAreReal = _payments.HandlesRealFunds,
        });
    }

    /// <summary>
    /// Confirm the caller's deposit payment and mark it Held, qualifying them to
    /// bid. <paramref name="paymentReference"/> carries the provider token (e.g. a
    /// Paystack transaction reference) when the provider handles real funds.
    /// </summary>
    [HttpPost("{auctionId}")]
    public async Task<ActionResult> Place(string auctionId, [FromQuery] string paymentReference = null)
    {
        var auction = await _auctionClient.GetOrFetchAuction(auctionId);
        if (auction == null) return NotFound("Auction not found");

        if (auction.Seller == Username)
            return BadRequest("You cannot deposit to bid on your own auction");
        if (auction.Finished || auction.AuctionEnd < DateTime.UtcNow)
            return BadRequest("This auction has finished");

        if (!BidDepositPolicy.Enabled(_config))
            return BadRequest("Bid deposits are not required.");

        // Already qualified — don't charge twice.
        var existing = await FindHeld(auctionId, Username);
        if (existing != null) return Ok(ToDto(existing));

        var amount = BidDepositPolicy.RequiredAmount(_config, auction.ReservePrice);
        var payment = await _payments.VerifyPaymentAsync(amount, paymentReference);
        if (!payment.Success)
        {
            _logger.LogWarning("PAYMENT bid_deposit_failed auction={Auction} user={User} reason={Reason}",
                auctionId, Username, payment.Message);
            return StatusCode(StatusCodes.Status402PaymentRequired, new { error = payment.Message });
        }

        var deposit = new BidDeposit
        {
            AuctionId = auctionId,
            Bidder = Username,
            Amount = amount,
            Currency = Currency,
            Status = BidDepositStatus.Held,
            PaymentProvider = _payments.Name,
            PaymentReference = payment.ProviderReference,
        };
        await DB.SaveAsync(deposit);

        _logger.LogInformation("SECURITY bid_deposit_held auction={Auction} user={User} amount={Amount} provider={Provider}",
            auctionId, Username, amount, _payments.Name);
        return Ok(ToDto(deposit));
    }

    /// <summary>Admin: forfeit a defaulting winner's held deposit (platform keeps it).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("{auctionId}/{bidder}/forfeit")]
    public async Task<ActionResult> Forfeit(string auctionId, string bidder)
    {
        var deposit = await FindHeld(auctionId, bidder);
        if (deposit == null) return NotFound("No held deposit for that bidder and auction.");

        deposit.Status = BidDepositStatus.Forfeited;
        deposit.ClosedAt = DateTime.UtcNow;
        await DB.SaveAsync(deposit);
        _logger.LogWarning("SECURITY bid_deposit_forfeited auction={Auction} bidder={Bidder} admin={Admin}",
            auctionId, bidder, Username);
        return Ok(ToDto(deposit));
    }

    private object ToDto(BidDeposit d) => new
    {
        auctionId = d.AuctionId,
        amount = d.Amount,
        currency = d.Currency,
        held = d.Status == BidDepositStatus.Held,
        status = d.Status.ToString(),
        activeProvider = _payments.Name,
        fundsAreReal = _payments.HandlesRealFunds,
    };
}
