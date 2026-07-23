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

namespace AuctionService.Controllers;

[ApiController]
[Route("api/auctions")]
public class AuctionsController : ControllerBase
{
    private readonly AuctionDbContext _context;
    private readonly IMapper _mapper;
    private readonly IPublishEndpoint _publishEndpoint;

    public AuctionsController(AuctionDbContext context, IMapper mapper,
        IPublishEndpoint publishEndpoint)
    {
        _context = context;
        _mapper = mapper;
        _publishEndpoint = publishEndpoint;
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
        // Deny-by-default input validation.
        if (auctionDto.AuctionEnd <= DateTime.UtcNow.AddMinutes(5))
        {
            return BadRequest("Auction end must be at least 5 minutes in the future");
        }

        if (auctionDto.ReservePrice < 0 || auctionDto.ReservePrice > 100_000_000)
        {
            return BadRequest("Reserve price out of range");
        }

        if (!Uri.TryCreate(auctionDto.ImageUrl, UriKind.Absolute, out var imageUri)
            || (imageUri.Scheme != Uri.UriSchemeHttp && imageUri.Scheme != Uri.UriSchemeHttps))
        {
            return BadRequest("Image URL must be an absolute http(s) URL");
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