# Deploying Yamkela Motors (Render + Vercel)

This app is **not** a single deployable — it's 6 .NET microservices, 3 datastores,
and a Next.js frontend. This runbook deploys:

| Piece | Host |
|---|---|
| Frontend (Next.js) | **Vercel** |
| 6 backend services | **Render** (`render.yaml` blueprint) |
| PostgreSQL | **Render** managed Postgres |
| MongoDB | **MongoDB Atlas** (free M0) |
| RabbitMQ | **CloudAMQP** (free "Little Lemur") |

> You run these steps — I can't create accounts, log in, or enter secrets on your
> behalf. Where a value is a secret it's marked `sync: false` in `render.yaml` and
> you paste it in the Render dashboard.

> **Cost note:** Render **private services (`pserv`) and always-on web services are
> paid** (Starter ≈ $7/mo each). Free web services sleep after inactivity and free
> Postgres expires after 90 days. Budget for ~6 small services if you want it always-on.

---

## 0. Prerequisites
Accounts: **GitHub**, **Render**, **Vercel**, **MongoDB Atlas**, **CloudAMQP**.
Tools: `git`, `openssl` (for the signing cert).

## 1. Push the repo to GitHub
```bash
gh auth login                       # or create the repo manually on github.com
gh repo create yamkela-motors --private --source=. --remote=origin
git push -u origin harden/critical-gaps   # (or merge to main first, then push main)
```
Render and Vercel deploy from this GitHub repo.

## 2. Provision the external datastores
**MongoDB Atlas:** create a free M0 cluster → Database Access: add a user → Network
Access: allow `0.0.0.0/0` (or Render's IPs) → copy the connection string:
`mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority`

**CloudAMQP:** create a free "Little Lemur" instance → copy the **AMQP URL**:
`amqps://<user>:<pass>@<host>/<vhost>`

## 3. Generate the IdentityServer signing certificate
```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 825 -nodes -subj "/CN=YamkelaIdentity"
openssl pkcs12 -export -inkey key.pem -in cert.pem -out identity-signing.pfx   # set a password
```
Keep `identity-signing.pfx` and its password for step 5.

## 4. Deploy the backend to Render (Blueprint)
Render Dashboard → **New → Blueprint** → connect your GitHub repo → it reads
`render.yaml` and creates: Postgres + `yamkela-identity`, `yamkela-gateway`
(public) + `yamkela-auction/search/bidding/notification` (private).

Then set the `sync: false` env vars on each service (Dashboard → service → Environment):

**Shared value — Postgres (Npgsql format), from your Render Postgres "Info" tab:**
`Host=<pg-host>;Port=5432;Database=yamkela;Username=<user>;Password=<pass>`
(Identity and Auction share this one database — their tables don't collide.)

| Service | Env var | Value |
|---|---|---|
| identity | `ConnectionStrings__DefaultConnection` | the Npgsql string above |
| identity | `IssuerUri` | `https://yamkela-identity.onrender.com` (this service's own URL) |
| identity | `ClientApp` | your Vercel URL, e.g. `https://yamkela.vercel.app` |
| identity | `IdentityServer__Clients__nextApp__Secret` | a strong random string (⇦ must equal the frontend's `NEXTAUTH_CLIENT_SECRET`) |
| identity | `IdentityServer__SigningCredential__Password` | the .pfx password from step 3 |
| identity | `Authentication__Google__ClientId` / `…__ClientSecret` | your Google OAuth creds (optional) |
| gateway | `IdentityServiceUrl` | `https://yamkela-identity.onrender.com` |
| auction | `ConnectionStrings__DefaultConnection` | the same Npgsql string |
| auction | `IdentityServiceUrl` | `https://yamkela-identity.onrender.com` |
| auction | `RabbitMq__Url` | the CloudAMQP `amqps://…` URL |
| search | `ConnectionStrings__MongoDbConnection` | the Atlas `mongodb+srv://…` URL |
| search | `RabbitMq__Url` | the CloudAMQP URL |
| bidding | `ConnectionStrings__BidDbConnection` | the Atlas URL |
| bidding | `IdentityServiceUrl` | `https://yamkela-identity.onrender.com` |
| bidding | `RabbitMq__Url` | the CloudAMQP URL |
| bidding | `Payments__Paystack__SecretKey` | your Paystack `sk_…` secret |
| bidding | `BidLedger__KeyPem` | a shared RSA private key PEM (`openssl genrsa 2048`) |
| notification | `RabbitMq__Url` | the CloudAMQP URL |
| notification | `ClientApp` | your Vercel URL (SignalR CORS origin) |

**Signing cert:** identity service → Environment → **Secret Files** → add
`identity-signing.pfx` at path `/etc/secrets/identity-signing.pfx` (already referenced
by `IdentityServer__SigningCredential__Path` in `render.yaml`).

Trigger a deploy. Watch each service's logs; identity runs its DB migrations on boot.

## 5. Deploy the frontend to Vercel
Vercel → **New Project** → import the repo → **Root Directory: `frontend/web-app`**
(Framework auto-detects Next.js). Add Environment Variables:

| Var | Value |
|---|---|
| `NEXTAUTH_SECRET` | a strong random string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | your Vercel URL, e.g. `https://yamkela.vercel.app` |
| `NEXTAUTH_CLIENT_SECRET` | **same** value as identity's `IdentityServer__Clients__nextApp__Secret` |
| `ID_URL` | `https://yamkela-identity.onrender.com` |
| `API_URL` | `https://yamkela-gateway.onrender.com/` (trailing slash required) |
| `NEXT_PUBLIC_NOTIFY_URL` | `https://yamkela-gateway.onrender.com/notifications` |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | your Paystack `pk_…` |
| `NEXT_PUBLIC_PAYSTACK_CURRENCY` | `GHS` |

Deploy. Note the final Vercel URL and make sure it matches `ClientApp`/`NEXTAUTH_URL` above.

## 6. Update third-party redirect URIs (to the public URLs)
- **Google** OAuth client → Authorized redirect URIs → add
  `https://yamkela-identity.onrender.com/signin-google`
- **Paystack** dashboard → Webhooks → set
  `https://yamkela-gateway.onrender.com/payments/paystack/webhook`

## 7. Verify
1. `https://yamkela-identity.onrender.com/.well-known/openid-configuration` → 200.
2. `https://yamkela-gateway.onrender.com/search?pageSize=1` → 200 JSON.
3. Open your Vercel site → sign in (password + Google) → browse listings → place a bid.

---

## Gotchas
- **Free web services sleep**; first request after idle is a slow cold start. Use Starter for always-on.
- **Private services (`pserv`) require a paid plan** on Render.
- Services bind Render's port via `ASPNETCORE_URLS=http://0.0.0.0:10000` (set in `render.yaml`).
- If the gateway 502s, a downstream private service isn't up yet — check its logs.
- Region is `frankfurt` in `render.yaml` (closest to Ghana); change if you prefer another.
- `AutoMapper 13.0.1` has a flagged advisory (NU1903) — consider bumping it before go-live.
