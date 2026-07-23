using BiddingService.Models;
using MongoDB.Entities;

namespace BiddingService.Services;

/// <summary>
/// Fallback lookup: when a bid arrives for an auction that isn't yet in the
/// local Mongo cache (e.g. seeded auctions created before this service
/// consumed AuctionCreated), fetch it from the AuctionService and cache it.
/// </summary>
public class AuctionServiceHttpClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AuctionServiceHttpClient> _logger;

    public AuctionServiceHttpClient(HttpClient httpClient, ILogger<AuctionServiceHttpClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<Auction> GetOrFetchAuction(string auctionId)
    {
        var local = await DB.Find<Auction>().OneAsync(auctionId);
        if (local != null) return local;

        try
        {
            var dto = await _httpClient.GetFromJsonAsync<AuctionRecord>($"api/auctions/{auctionId}");
            if (dto == null) return null;

            var auction = new Auction
            {
                ID = dto.Id,
                Seller = dto.Seller,
                AuctionEnd = dto.AuctionEnd,
                ReservePrice = dto.ReservePrice,
                Finished = dto.AuctionEnd < DateTime.UtcNow,
            };
            await auction.SaveAsync();

            _logger.LogInformation("Backfilled auction {Auction} from AuctionService", auctionId);
            return auction;
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Could not fetch auction {Auction} from AuctionService: {Message}",
                auctionId, ex.Message);
            return null;
        }
    }

    private record AuctionRecord(string Id, string Seller, DateTime AuctionEnd, int ReservePrice);
}
