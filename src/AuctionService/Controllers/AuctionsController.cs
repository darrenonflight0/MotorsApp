using AuctionService.Data;
using AuctionService.DTOs;
using AuctionService.Entities;
using MassTransit;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Contracts;
using System.Text.Json;

namespace AuctionService.Controllers;

[ApiController]
[Route("api/auctions")]
public class AuctionsController : ControllerBase
{
    private readonly AuctionDbContext _context;
    private readonly IMapper _mapper;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<AuctionsController> _logger;

    public AuctionsController(AuctionDbContext context, IMapper mapper,
        IPublishEndpoint publishEndpoint, IHttpClientFactory httpFactory,
        ILogger<AuctionsController> logger)
    {
        _context = context;
        _mapper = mapper;
        _publishEndpoint = publishEndpoint;
        _httpFactory = httpFactory;
        _logger = logger;
    }

    // Checks the seller's LIVE verification status against the IdentityService,
    // so an admin's revocation takes effect immediately rather than waiting for
    // the seller's token (which carries a stale `verified` claim) to refresh.
    private async Task<bool> IsVerifiedSellerAsync(string username)
    {
        try
        {
            var client = _httpFactory.CreateClient("identity");
            var resp = await client.GetAsync($"api/profile/{Uri.EscapeDataString(username)}");
            if (!resp.IsSuccessStatusCode) return false; // fail closed
            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
            return doc.RootElement.TryGetProperty("verified", out var v) && v.ValueKind == JsonValueKind.True;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "verified_check_failed user={User}", username);
            return false; // fail closed: no verification confirmation → not allowed to sell
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<AuctionDto>>> GetAllAuctions(string date)
    {
        var query = _context.Auctions.OrderBy(x => x.Item.Make).AsQueryable();

        if (!string.IsNullOrEmpty(date))
        {
            query = query.Where(x => x.UpdatedAt.CompareTo(DateTime.Parse(date).ToUniversalTime()) > 0);
        }

        return await query.ProjectTo<AuctionDto>(_mapper.ConfigurationProvider).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AuctionDto>> GetAuctionById(Guid id)
    {
        var auction = await _context.Auctions
            .Include(x => x.Item)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (auction == null) return NotFound();

        return _mapper.Map<AuctionDto>(auction);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<AuctionDto>> CreateAuction(CreateAuctionDto auctionDto)
    {
        // Only currently-verified sellers may list a car. Checked live so a
        // revoked authorisation blocks new listings immediately.
        var seller = User.Identity?.Name;
        if (string.IsNullOrEmpty(seller) || !await IsVerifiedSellerAsync(seller))
        {
            _logger.LogWarning("SECURITY listing_denied_unverified user={User}", seller);
            return StatusCode(StatusCodes.Status403Forbidden,
                "You must be a verified seller to list a car.");
        }

        // Deny-by-default input validation.
        if (auctionDto.AuctionEnd <= DateTime.UtcNow.AddMinutes(5))
        {
            return BadRequest("Auction end must be at least 5 minutes in the future");
        }

        if (auctionDto.ReservePrice < 0 || auctionDto.ReservePrice > 100_000_000)
        {
            return BadRequest("Reserve price out of range");
        }

        // Photos: sellers upload images (data URIs) rather than pasting URLs. Use
        // the first uploaded image as the cover when one isn't set explicitly.
        auctionDto.Images ??= new List<string>();
        if (string.IsNullOrWhiteSpace(auctionDto.ImageUrl) && auctionDto.Images.Count > 0)
        {
            auctionDto.ImageUrl = auctionDto.Images[0];
        }
        if (string.IsNullOrWhiteSpace(auctionDto.ImageUrl))
        {
            return BadRequest("At least one photo of the car is required");
        }

        var cover = auctionDto.ImageUrl;
        var isUpload = cover.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase);
        var isHttp = Uri.TryCreate(cover, UriKind.Absolute, out var imageUri)
                     && (imageUri.Scheme == Uri.UriSchemeHttp || imageUri.Scheme == Uri.UriSchemeHttps);
        if (!isUpload && !isHttp)
        {
            return BadRequest("The cover photo must be an uploaded image.");
        }

        var auction = _mapper.Map<Auction>(auctionDto);
        auction.Seller = User.Identity.Name;

        _context.Auctions.Add(auction);

        var newAuction = _mapper.Map<AuctionDto>(auction);

        await _publishEndpoint.Publish(_mapper.Map<AuctionCreated>(newAuction));

        var result = await _context.SaveChangesAsync() > 0;

        if (!result) return BadRequest("Could not save changes to DB");

        return CreatedAtAction(nameof(GetAuctionById),
            new { auction.Id }, newAuction);
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateAuction(Guid id, UpdatedAuctionDto updatedAuctionDto)
    {
        var auction = await _context.Auctions
            .Include(x => x.Item)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (auction == null) return NotFound();

        // Ownership check: only the seller may edit their lot.
        if (auction.Seller != User.Identity.Name) return Forbid();

        // Lots cannot be rewritten after the hammer falls.
        if (auction.AuctionEnd < DateTime.UtcNow)
        {
            return BadRequest("Cannot edit an auction that has ended");
        }

        auction.Item.Make = updatedAuctionDto.Make ?? auction.Item.Make;
        auction.Item.Model = updatedAuctionDto.Model ?? auction.Item.Model;
        auction.Item.Color = updatedAuctionDto.Color ?? auction.Item.Color;
        auction.Item.Milage = updatedAuctionDto.Milage ?? auction.Item.Milage;
        auction.Item.Year = updatedAuctionDto.Year ?? auction.Item.Year;

        await _publishEndpoint.Publish(_mapper.Map<AuctionUpdated>(auction));

        var result = await _context.SaveChangesAsync() > 0;

        if (result) return Ok();

        return BadRequest("Issue Saving Changes");
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteAuction(Guid id)
    {
        var auction = await _context.Auctions.FindAsync(id);

        if (auction == null) return NotFound();

        // Ownership check: only the seller may withdraw their lot.
        if (auction.Seller != User.Identity.Name) return Forbid();

        // A finished (sold) auction cannot be deleted out from under settlement.
        if (auction.AuctionEnd < DateTime.UtcNow)
        {
            return BadRequest("Cannot delete an auction that has ended");
        }

        _context.Auctions.Remove(auction);

        await _publishEndpoint.Publish<AuctionDeleted>(new { Id = auction.Id.ToString() });

        var result = await _context.SaveChangesAsync() > 0;

        if (!result) return BadRequest("Could not update database");

        return Ok();
    }
}