namespace Contracts;

/// <summary>
/// A per-user update on an escrowed sale: payment received, a shipment stage
/// change, or a new message from the other party. NotificationService relays it
/// over SignalR; clients show it only to <see cref="Recipient"/>.
/// </summary>
public class EscrowActivity
{
    public string AuctionId { get; set; }
    public string Recipient { get; set; }
    public string Kind { get; set; }      // "Funded" | "Shipment" | "Message"
    public string Message { get; set; }
}
