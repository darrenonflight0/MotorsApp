using System.ComponentModel.DataAnnotations;

namespace AuctionService.DTOs;

public class CreateAuctionDto

{
    [Required]
     public string Make {get; set;}

    [Required]
    public string Model {get; set;}

    [Required]
    public int Year {get; set;}
    [Required]
    public string Color {get; set;}
    [Required]
    public int Milage {get; set;}
    [Required]
    public string ImageUrl {get; set;}
    [Required]
    public int ReservePrice {get; set;}
    [Required]
    public DateTime AuctionEnd {get; set;}
    [Required]
    public string Country {get; set;}

    // Condition & fault disclosure. Required so sellers cannot list a vehicle
    // without stating its known condition — a core anti-deception safeguard.
    [Required]
    [StringLength(4000, MinimumLength = 10,
        ErrorMessage = "Please describe the vehicle's condition and any known faults (10–4000 characters).")]
    public string Description {get; set;}

}