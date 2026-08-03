# Weapons of Chaos and Order

A persistent multiplayer medieval strategy RPG in which a player raises a minor
House from a frontier outpost into a regional power, masters weapon forging from
crude arms to steel masterworks, and eventually discovers runes and risks them in
Runeforging.

**Current stage: Prompt 3 — the first domain model exists.** One Arkazian House
establishes an outpost, constructs buildings, and manages the six universal
resources. The rules are enforced and tested, and the House aggregate persists
to PostgreSQL.

Nothing is playable yet: there is no API over the domain and no screen for it.
Forging, armies and battles are later prompts.

- Product source of truth: [`docs/Weapons_of_Chaos_and_Order_Game_Workbase.md`](docs/Weapons_of_Chaos_and_Order_Game_Workbase.md)
- Execution contract: [`docs/Weapons_of_Chaos_and_Order_Agent_AI_Implementation_Prompts.md`](docs/Weapons_of_Chaos_and_Order_Agent_AI_Implementation_Prompts.md)
- Architecture: [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md)
- Decisions: [`docs/adr/`](docs/adr/)
- Status: [`docs/implementation/STATUS.md`](docs/implementation/STATUS.md)
- Working rules for humans and agents: [`AGENTS.md`](AGENTS.md)

---

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| .NET SDK | 10.0.200 (pinned in `global.json`) | `dotnet --list-sdks` |
| Node.js | 22 (pinned in `.nvmrc`) | `node --version` |
| Docker Desktop | with Compose v2 | `docker compose version` |

Nothing else. **No Azure account and no paid service is required.**

---

## First run

Three terminals. Run them in this order.

**1 — PostgreSQL**

```bash
docker compose -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml ps      # wait for "healthy"
```

The container publishes **host port 5433**, not 5432. If a PostgreSQL service is
already installed on your machine it owns 5432, and that listener silently wins
over the Docker mapping — you get an authentication failure against the wrong
server.

If 5433 is also taken, see [Configuration](#configuration) — changing the port
takes two steps, not one.

**2 — Backend**

```bash
dotnet run --project src/Woo.Api
```

Serves <http://localhost:5080>.

```bash
curl http://localhost:5080/health
curl http://localhost:5080/api/v1/platform/status
```

**3 — Frontend**

```bash
cd web
npm ci
npm run dev
```

Open <http://localhost:5173>. The page shows the application name, environment,
server time and database state — all fetched from the backend. The Vite dev
server proxies `/api` to `http://localhost:5080`, which is why the backend needs
no CORS configuration.

---

## Daily loop

```bash
docker compose -f docker/docker-compose.yml up -d   # if not already running
dotnet run --project src/Woo.Api                    # terminal 1
cd web && npm run dev                               # terminal 2
```

Stop the database with `docker compose -f docker/docker-compose.yml down`. Add
`-v` to delete its data volume as well.

---

## Validation

These are exactly the commands CI runs.

```bash
# Backend — needs PostgreSQL running
dotnet tool restore                 # dotnet-ef, for migrations
dotnet format --verify-no-changes
dotnet build -c Release
dotnet test

# Frontend — from web/
npm ci
npm run lint
npm run typecheck
npm run build

# Documentation
bash scripts/check-adrs.sh
bash scripts/check-doc-links.sh
```

A command is added to this list in the same change that makes it runnable, never
before.

---

## Configuration

There are **two separate configuration systems**, and they do not talk to each
other.

| | Reads | Configures |
|---|---|---|
| `docker/.env` | Docker Compose | The PostgreSQL **container** only |
| `ConnectionStrings__Woo`, or `appsettings.Development.json` | The .NET application | The **API and the tests** |

**`.env` configures Docker Compose only. The backend never reads it**, and no
dotenv package is installed — the .NET configuration system already layers
`appsettings.json` → `appsettings.{Environment}.json` → environment variables.

Two consequences worth stating plainly:

1. **Compose reads `.env` from `docker/`, not from the repository root**, because
   that is the directory holding the compose file. A `.env` at the root is
   ignored. Start from the template:

   ```bash
   cp docker/.env.example docker/.env
   ```

2. **Changing `POSTGRES_PORT` or `POSTGRES_PASSWORD` takes two steps.** Editing
   `docker/.env` moves the container; the API and the tests carry on using the
   connection string in `src/Woo.Api/appsettings.Development.json`, which is
   fixed at port 5433 with the password `woo`. They will then point at the wrong
   server or fail to authenticate.

   Set `ConnectionStrings__Woo` explicitly in the shell that runs them:

   ```powershell
   # PowerShell
   $env:ConnectionStrings__Woo = "Host=localhost;Port=5555;Database=woo;Username=woo;Password=secret"
   dotnet run --project src/Woo.Api
   ```

   ```bash
   # bash
   ConnectionStrings__Woo="Host=localhost;Port=5555;Database=woo;Username=woo;Password=secret" \
     dotnet run --project src/Woo.Api
   ```

   The test project reads the same variable, with the same fallback. CI sets it
   directly rather than using a `.env` file at all.

The application **refuses to start**, with a clear message, if the connection
string is missing. `docker/.env` is gitignored; no secret is committed.

---

## Layout

```
src/Woo.Api/         one ASP.NET Core application
  Features/          one folder per feature — Houses, Settlements, Resources
  Content/           starter catalogues, static C#
  Persistence/       WooDbContext, Configurations/, Migrations/
tests/Woo.Tests/     the one test project
web/                 React, TypeScript and Vite client
docker/              PostgreSQL only
docs/                planning documents, architecture, ADRs, status
project_sources/     the lore canon — 12 files, read before touching lore
scripts/             documentation checks
```

### Migrations

```bash
dotnet tool restore
dotnet ef migrations list --project src/Woo.Api
dotnet ef migrations add <Name> --project src/Woo.Api --output-dir Persistence/Migrations
```

The API applies migrations automatically **in Development only**, so the first
run needs no separate step. Anywhere else it is an explicit, reviewed action.
