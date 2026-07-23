# Recovering the Mongo-backed services

During a heavy rebuild/restart cycle the Docker Desktop VM wedged: `docker exec`,
`docker restart`, and even kill/rm/recreate of the `yamkela-mongodb-1` container
all hang, so **SearchService** (port 7002) and **BiddingService** (port 7003)
cannot connect to MongoDB. Postgres, RabbitMQ, IdentityService, AuctionService and
GatewayService are unaffected.

This is an environment issue, not an application bug. To recover:

1. **Restart Docker Desktop.** If `docker version` hangs, the WSL2 backend is
   wedged. Recover it with:
   ```
   wsl --shutdown
   taskkill //IM "Docker Desktop.exe" //F
   taskkill //IM com.docker.backend.exe //F
   start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
   ```
   Wait ~45s for the daemon (`docker ps` should respond quickly).

   **IMPORTANT — do NOT `docker compose up` to bring the DBs back.** From this
   folder the compose project name resolves to `yamkela-main`, which creates
   brand-new **empty** volumes. The real data lives in the original `yamkela-*`
   containers (project `yamkela`, volumes `yamkela_pgdata` / `yamkela_mongodata`).
   Start those instead:
   ```
   docker start yamkela-postgres-1 yamkela-mongodb-1 yamkela-rabbitmq-1
   ```
   (If compose already created empty `yamkela-main-*` containers, remove them
   first: `docker rm -f yamkela-main-postgres-1 yamkela-main-mongodb-1 yamkela-main-rabbitmq-1`.)

2. Confirm Mongo answers:
   ```
   docker exec yamkela-mongodb-1 mongosh -u root -p mongopw \
     --authenticationDatabase admin --quiet --eval "db.runCommand({ping:1}).ok"
   ```
   It should print `1` within a second.

3. Restart the two Mongo-backed services (from `src/<Service>`):
   ```
   dotnet run --launch-profile http   # in SearchService
   dotnet run --launch-profile http   # in BiddingService
   ```
   SearchService reseeds its index from AuctionService on startup, so the
   country-tagged demo auctions (Japan, USA, Canada, South Africa, China, Ghana)
   will re-index automatically and the Shop-by-country filter will return them.

4. Verify country filtering:
   ```
   curl "http://localhost:6001/search?country=Japan"     # expect Land Cruiser, GT-R
   curl "http://localhost:6001/search?country=USA"        # expect F-150, Model 3
   ```

Everything else — auth pages, brand browse, shipping, how-to-buy, about, help,
country picker UI, escrow, bid ledger — is already built and verified.
