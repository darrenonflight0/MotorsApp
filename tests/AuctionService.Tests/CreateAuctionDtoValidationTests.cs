using System.ComponentModel.DataAnnotations;
using AuctionService.DTOs;
using Xunit;

namespace Yamkela.UnitTests;

/// <summary>
/// Validates the data-annotation rules on CreateAuctionDto — in particular the
/// required condition/fault-disclosure Description that underpins honest listings.
/// </summary>
public class CreateAuctionDtoValidationTests
{
    private static IList<ValidationResult> Validate(CreateAuctionDto dto)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, new ValidationContext(dto), results, validateAllProperties: true);
        return results;
    }

    private static CreateAuctionDto Valid() => new()
    {
        Make = "Toyota",
        Model = "GR Yaris",
        Year = 2023,
        Color = "Silver",
        Milage = 12000,
        ImageUrl = "https://example.com/car.jpg",
        ReservePrice = 35000,
        AuctionEnd = DateTime.UtcNow.AddDays(3),
        Country = "Japan",
        Description = "Full service history, one small kerb scuff on the front-left alloy.",
    };

    [Fact]
    public void FullyPopulatedDto_IsValid()
    {
        Assert.Empty(Validate(Valid()));
    }

    [Fact]
    public void MissingDescription_IsInvalid()
    {
        var dto = Valid();
        dto.Description = null;

        var results = Validate(dto);
        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateAuctionDto.Description)));
    }

    [Fact]
    public void TooShortDescription_IsInvalid()
    {
        var dto = Valid();
        dto.Description = "scratch"; // below the 10-char minimum

        var results = Validate(dto);
        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateAuctionDto.Description)));
    }

    [Fact]
    public void MissingRequiredCoreFields_AreReported()
    {
        var dto = Valid();
        dto.Make = null;
        dto.Country = null;

        var results = Validate(dto);
        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateAuctionDto.Make)));
        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateAuctionDto.Country)));
    }
}
