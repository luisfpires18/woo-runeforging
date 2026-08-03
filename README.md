# Weapons of Chaos and Order

A persistent multiplayer medieval strategy RPG in which a player raises a minor
House from a frontier outpost into a regional power, masters weapon forging from
crude arms to steel masterworks, and eventually discovers runes and risks them in
Runeforging.

**Current stage: Prompt 2 — the platform exists and nothing else does.** There is
no gameplay. The application starts, reaches PostgreSQL, and the web client
successfully calls one API endpoint. That is the whole feature set.

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
server. Override the port with `POSTGRES_PORT` if 5433 is also taken.

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

`appsettings.Development.json` carries the local Compose connection string.
Every other environment supplies `ConnectionStrings__Woo`. The application
**refuses to start** with a clear message if it is missing.

Copy `.env.example` to `.env` to change the database password or published port.
`.env` is gitignored; no secret is committed.

---

## Layout

```
src/Woo.Api/      one ASP.NET Core application, organised by feature folder
tests/Woo.Tests/  the one test project
web/              React, TypeScript and Vite client
docker/           PostgreSQL only
docs/             planning documents, architecture, ADRs, status
scripts/          documentation checks
```
