using Microsoft.AspNetCore.Mvc;
using MongoDB.Entities;
using SearchService.RequestHelpers;

namespace SearchService.Controllers;

[ApiController]
[Route("api/search")]
public class SearchController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<Item>>> SearchItems([FromQuery] SearchParams searchParams)
    {
        var query = DB.PagedSearch<Item, Item>();

        if (!string.IsNullOrEmpty(searchParams.SearchTerm))
        {
            query.Match(Search.Full, searchParams.SearchTerm).SortByTextScore();
        }
        else
        {
            query = searchParams.OrderBy switch
            {
                "make" => query.Sort(x => x.Ascending(a => a.Make)),
                "new" => query.Sort(x => x.Descending(a => a.CreatedAt)),
                _ => query.Sort(x => x.Ascending(a => a.AuctionEnd))
            };
        }

        query = searchParams.FilterBy switch
        {
            "finished" => query.Match(x => x.AuctionEnd < DateTime.UtcNow),
            "endingSoon" => query.Match(x => x.AuctionEnd < DateTime.UtcNow.AddHours(6)
                && x.AuctionEnd > DateTime.UtcNow),
            _ => query.Match(x => x.AuctionEnd > DateTime.UtcNow)
        };

        if (!string.IsNullOrEmpty(searchParams.Seller))
        {
            query = query.Match(x => x.Seller == searchParams.Seller);
        }

        if (!string.IsNullOrEmpty(searchParams.Winner))
        {
            query = query.Match(x => x.Winner == searchParams.Winner);
        }

        if (!string.IsNullOrEmpty(searchParams.Country))
        {
            query = query.Match(x => x.Country == searchParams.Country);
        }

        if (!string.IsNullOrEmpty(searchParams.VehicleType))
        {
            query = query.Match(x => x.VehicleType == searchParams.VehicleType);
        }

        query.PageNumber(searchParams.PageNumber);
        query.PageSize(searchParams.PageSize);

        var results = await query.ExecuteAsync();

        return Ok(new
        {
            results = results.Results,
            pageCount = results.PageCount,
            totalCount = results.TotalCount
        });
    }
}