using System.ComponentModel.DataAnnotations.Schema;
using AuctionService.Entities;

namespace AuctionService.Entities;
[Table("Items")]
public class Items
{
    public Guid Id {get; set;}
    public string Make {get; set;}
    public string Model {get; set;}
    public int Year {get; set;}
    public string Color {get; set;}
    public int Milage {get; set;}
    public string ImageUrl {get; set;}
    public string Country {get; set;} = "";
    public string VehicleType {get; set;} = "";
    public string Description {get; set;} = "";
    // All uploaded photos (data URIs); ImageUrl is the cover (first) image.
    public List<string> Images {get; set;} = new();



    //nav property

    public Auction Auction {get; set;}
    public Guid AuctionId {get; set;}
}