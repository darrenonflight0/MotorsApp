using System.Collections.Concurrent;
using AutoMapper;
using BiddingService.DTOs;
using BiddingService.Models;
using BiddingService.Services;
using Contracts;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Entities;

namespace BiddingService.Controllers;

[ApiController]
[Route("api/bids")]
public class BidsController : ControllerBase
{
    // Hostile-environment limits.
    private const int MaxBidAmount = 100_000_000;
    private static readonly TimeSpan SnipeWindow = TimeSpan.FromSeconds(60);
    private static readonly TimeSpan SnipeExtension = TimeSpan.FromMinutes(3);

    // Serialize bid processing per auction to eliminate read-check-write races.
    // NOTE: in-process lock — run BiddingService as a single instance, or swap
    // for a distributed lock / queue before scaling out.
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> AuctionLocks = new();

    private readonly IMapper _mapper;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly BidLedger _ledger;
    private readonly AuctionServiceHttpClient _auctionClient;
    private readonly IConfiguration _config;
    private readonly ILogger<BidsController> _logger;

    public BidsController(IMapper mapper, IPublishEndpoint publishEndpoint,
        BidLedger ledger, AuctionServiceHttpClient auctionClient, IConfiguration config,
        ILogger<BidsController> logger)
    {
        _mapper = mapper;
        _publishEndpoint = publishEndpoint;
        _ledger = ledger;
        _auctionClient = auctionClient;
        _config = config;
        _logger = logger;
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<BidDto>> PlaceBid(string auctionId, int amount)
    {
        // Deny-by-default input validation.
        if (string.IsNullOrWhiteSpace(auctionId) || auctionId.Length > 64)
        {
            return BadRequest("Invalid auction id");
        }

        if (amount <= 0 || amount > MaxBidAmount)
        {
            _logger.LogWarning("SECURITY bid_rejected_amount user={User} auction={Auction} amount={Amount}",
                User.Identity.Name, auctionId, amount);
            return BadRequest("Bid amount out of range");
        }

        var auctionLock = AuctionLocks.GetOrAdd(auctionId, _ => new SemaphoreSlim(1, 1));
        await auctionLock.WaitAsync();
        try
        {
            // Falls back to the AuctionService (and caches locally) when the
            // auction isn't in our Mongo cache yet.
            var auction = await _auctionClient.GetOrFetchAuction(auctionId);

            if (auction == null)
            {
                return NotFound("Auction not found");
            }

            // Shill-bid guard: sellers cannot bid on their own lots.
            if (auction.Seller == User.Identity.Name)
            {
                _logger.LogWarning("SECURITY bid_rejected_own_auction user={User} auction={Auction}",
                    User.Identity.Name, auctionId);
                return BadRequest("You cannot bid on your own auction");
            }

            // Bid-deposit gate: a bidder must have a paid, refundable deposit for
            // this lot before any bid is accepted, so fake bidders with no means
            // (or intent) to pay can't inflate or ghost the auction.
            if (BidDepositPolicy.Enabled(_config))
            {
                var requiredDeposit = BidDepositPolicy.RequiredAmount(_config, auction.ReservePrice);
                if (requiredDeposit > 0)
                {
                    var held = await DB.Find<BidDeposit>()
                        .Match(d => d.AuctionId == auctionId && d.Bidder == User.Identity.Name
                            && d.Status == BidDepositStatus.Held)
                        .ExecuteFirstAsync();
                    if (held == null)
                    {
                        _logger.LogWarning("SECURITY bid_rejected_no_deposit user={User} auction={Auction}",
                            User.Identity.Name, auctionId);
                        return StatusCode(StatusCodes.Status402PaymentRequired, new
                        {
                            error = $"A refundable bid deposit of {requiredDeposit} is required before you can bid on this lot.",
                            requiredDeposit,
                        });
                    }
                }
            }

            var bid = new Bid
            {
                Amount = amount,
                AuctionId = auctionId,
                Bidder = User.Identity.Name
            };

            var extended = false;

            if (auction.Finished || auction.AuctionEnd < DateTime.UtcNow)
            {
                bid.BidStatus = BidStatus.Finished;
            }
            else
            {
                var highBid = await DB.Find<Bid>()
                    .Match(a => a.AuctionId == auctionId)
                    .Sort(b => b.Descending(x => x.Amount))
                    .ExecuteFirstAsync();

                if (highBid == null || amount > highBid.Amount)
                {
                    bid.BidStatus = amount > auction.ReservePrice
                        ? BidStatus.Accepted
                        : BidStatus.AcceptedBelowReserve;
                }
                else
                {
                    bid.BidStatus = BidStatus.TooLow;
                }

                // Anti-sniping: a bid inside the final minute extends the auction.
                if (bid.BidStatus != BidStatus.TooLow
                    && auction.AuctionEnd - DateTime.UtcNow < SnipeWindow)
                {
                    auction.AuctionEnd = DateTime.UtcNow.Add(SnipeExtension);
                    await DB.SaveAsync(auction);
                    extended = true;
                }
            }

            // Seal into the tamper-evident chain before persisting.
            var previous = await DB.Find<Bid>()
                .Match(a => a.AuctionId == auctionId)
                .Sort(b => b.Descending(x => x.BidTime))
                .ExecuteFirstAsync();
            _ledger.Seal(bid, previous);

            await DB.SaveAsync(bid);

            _logger.LogInformation(
                "SECURITY bid_placed user={User} auction={Auction} amount={Amount} status={Status} hash={Hash}",
                bid.Bidder, auctionId, amount, bid.BidStatus, bid.BidHash);

            await _publishEndpoint.Publish(_mapper.Map<BidPlaced>(bid));

            if (extended)
            {
                _logger.LogInformation("SECURITY auction_extended auction={Auction} newEnd={End}",
                    auctionId, auction.AuctionEnd);
                await _publishEndpoint.Publish(new AuctionEndExtended
                {
                    AuctionId = auctionId,
                    NewAuctionEnd = auction.AuctionEnd,
                });
            }

            return Ok(_mapper.Map<BidDto>(bid));
        }
        finally
        {
            auctionLock.Release();
        }
    }

    [HttpGet("{auctionId}")]
    public async Task<ActionResult<List<BidDto>>> GetBidsForAuction(string auctionId)
    {
        var bids = await DB.Find<Bid>()
            .Match(a => a.AuctionId == auctionId)
            .Sort(b => b.Descending(a => a.BidTime))
            .ExecuteAsync();

        return bids.Select(_mapper.Map<BidDto>).ToList();
    }

    /// <summary>Public integrity check: re-validates the auction's full bid chain.</summary>
    [HttpGet("{auctionId}/verify")]
    public async Task<ActionResult> VerifyChain(string auctionId)
    {
        var (valid, sealedCount, legacyCount, brokenAt) = await _ledger.VerifyChain(auctionId);
        if (!valid)
        {
            _logger.LogError("SECURITY bid_chain_broken auction={Auction} bid={Bid}", auctionId, brokenAt);
        }
        return Ok(new { auctionId, valid, sealedBids = sealedCount, legacyBids = legacyCount, brokenAt });
    }

    /// <summary>Platform ledger public key so third parties can verify signatures.</summary>
    [HttpGet("ledger/public-key")]
    public ActionResult PublicKey()
    {
        return Content(_ledger.PublicKeyPem, "text/plain");
    }
}
