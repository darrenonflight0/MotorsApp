using Duende.IdentityServer.Models;

namespace IdentityService;

public static class Config
{
    public static IEnumerable<IdentityResource> IdentityResources =>
        new IdentityResource[]
        {
            new IdentityResources.OpenId(),
            new IdentityResources.Profile(),
            new IdentityResource("roles", "User roles", new[] { "role" }),
        };

    public static IEnumerable<ApiScope> ApiScopes =>
        new ApiScope[]
        {
            // Carry role/username/verified as user claims so IdentityServer emits
            // them into the ACCESS token. Without this the API-side
            // [Authorize(Roles="Admin")] guards (seller-verification review, escrow
            // resolution, role management) never see the role and return 403 —
            // which the admin UI shows as an empty list.
            new ApiScope("auctionApp", "Auction app full access")
            {
                UserClaims = { "role", "username", "verified" },
            },
        };

    public static IEnumerable<Client> Clients(IConfiguration config, bool isDevelopment)
    {
        // Client secrets come from configuration (env vars / user-secrets / key vault)
        // so no real secret is ever committed to source. The literals below are
        // development-only fallbacks; production MUST override them.
        var nextSecret = config["IdentityServer:Clients:nextApp:Secret"];
        if (string.IsNullOrWhiteSpace(nextSecret))
        {
            if (!isDevelopment)
                throw new InvalidOperationException(
                    "IdentityServer:Clients:nextApp:Secret must be configured in production. " +
                    "Refusing to start with a weak default client secret.");
            nextSecret = "secret"; // development convenience only
        }

        var clients = new List<Client>
        {
            new Client
            {
                ClientId = "nextApp",
                ClientName = "nextApp",
                ClientSecrets = { new Secret(nextSecret.Sha256()) },
                AllowedGrantTypes = GrantTypes.CodeAndClientCredentials,
                RequirePkce = true,
                RedirectUris = { config["ClientApp"] + "/api/auth/callback/id-server" },
                AllowOfflineAccess = true,
                AllowedScopes = { "openid", "profile", "roles", "auctionApp", "offline_access" },

                // Short-lived access tokens; sessions continue via rotating refresh tokens.
                AccessTokenLifetime = 60 * 15,
                // Reusable (not one-time) refresh tokens: NextAuth's jwt callback
                // can refresh from more than one request, and one-time rotation made
                // the second lose the race -> RefreshAccessTokenError -> the server
                // then calls APIs (admin verification list, etc.) with a dead token
                // and gets 401, which the UI renders as "nothing here". Access tokens
                // stay short-lived (15 min), so the exposure is limited.
                RefreshTokenUsage = TokenUsage.ReUse,
                RefreshTokenExpiration = TokenExpiration.Sliding,
                SlidingRefreshTokenLifetime = 3600 * 24 * 14,
                UpdateAccessTokenClaimsOnRefresh = true,

                AlwaysIncludeUserClaimsInIdToken = true,
            },
        };

        // The Postman client uses the Resource Owner Password grant, which trades
        // the user's password directly for tokens. It exists only as a local
        // testing convenience and must never be exposed in production.
        if (isDevelopment)
        {
            var postmanSecret = config["IdentityServer:Clients:postman:Secret"] ?? "NotASecret";
            clients.Add(new Client
            {
                ClientId = "postman",
                ClientName = "Postman",
                AllowedScopes = { "openid", "profile", "auctionApp" },
                RedirectUris = { "https://www.getpostman.com/oauth2/callback" },
                ClientSecrets = { new Secret(postmanSecret.Sha256()) },
                AllowedGrantTypes = { GrantType.ResourceOwnerPassword },
            });
        }

        return clients;
    }
}
