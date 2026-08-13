using MongoDB.Entities;

namespace BiddingService.Models;

/// <summary>
/// The platform's bid-ledger signing key, persisted in the BiddingService's own
/// Mongo database so it survives redeploys and restarts without a hand-carried
/// env-var secret. Generated once on first run and reused thereafter, so bid
/// signatures stay verifiable across restarts. Mongo is the trust boundary here
/// (the same posture as the persisted IdentityServer signing keys in Postgres).
/// </summary>
public class LedgerKey : Entity
{
    public string PrivateKeyPem { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
