# ADR-0010 — Environments, delivery, testing and cost

**Status:** Superseded by [ADR-0014](0014-local-development-and-ci.md)
**Date:** 1 August 2026

> **Superseded by [ADR-0014](0014-local-development-and-ci.md) on 3 August 2026.**
> Docker Compose survives, reduced to PostgreSQL. The Azure Container Apps topology, Bicep, budgets, backup/restore procedures and the deployment pipeline are deferred until a local playable slice exists.
>
> The text below is left unedited as the record of what was designed and
> why it was cut back. Do not treat it as current.

---

## Context

The operational target is local development first, then a closed test of about
twenty players. The budget is an **Azure for Students** subscription: $100 of
credit for twelve months, plus a set of always-free services.

Constraints from the Workbase and the implementation contract:

- Local development must not require Azure or any paid service.
- Keep the application containerized and portable to another cloud, Docker
  Compose or a VPS.
- Avoid premium Azure services unless justified and approved.
- Budgets, cost alerts, conservative sizes and scale-to-zero where appropriate.
- **Never deploy, push, publish, purchase services or rotate credentials without
  explicit authorization.**

An always-on worker replica would consume roughly 648,000 vCPU-seconds per
month against a 180,000 free grant — the single largest avoidable cost in the
naive design.

## Decision

### Local development — Docker Compose

Services: `db` (postgres:18-alpine, named volume, healthcheck), `blob`
(Azurite), `migrate` (one-shot), `api`, `worker`, `web`.

| Mode | Command |
|---|---|
| Full stack | `docker compose -f docker/docker-compose.yml up` |
| Host mode (daily) | `docker compose up db blob`, then run API and worker from the IDE with `npm run dev` |

Azurite substitutes for Blob Storage through the identical SDK. A deterministic
seed and reset command (`tools/Woo.Seed -- --reset`) rebuilds a known world in
seconds.

**.NET Aspire is not adopted yet.** Compose is the deployment-portable artefact
and maps directly onto the Azure container model. Aspire's dashboard is
attractive and can be added later as a purely local convenience.

### Azure topology

| Resource | Configuration |
|---|---|
| Container Apps Environment | Consumption workload profile |
| `ca-woo-api` | 0.25 vCPU / 0.5 GiB; `minReplicas` 1 during test windows, 0 otherwise; serves SPA and API |
| `caj-woo-worker` | Container Apps **Job**, Schedule trigger, cron `*/2 * * * *`, `replicaTimeout` 300 |
| `caj-woo-migrate` | Container Apps Job, Manual trigger |
| PostgreSQL Flexible Server | Burstable **B1ms**, 32 GiB, PG 18, single zone, no HA, 7-day backups |
| Storage Account | Standard LRS Hot; `assets` (public read), `content` (private) |
| Registry | **ghcr.io** — free |
| Log Analytics | Daily cap, 30-day retention |
| Application Insights | Workspace-based, sampled, capped |
| Identity | **Managed identity** to PostgreSQL (Entra auth) and Blob Storage |

Infrastructure as code in **Bicep** under `infra/bicep/`. Deployment-only — the
apps are plain OCI containers.

### Why the worker is a scheduled job

At a two-minute cron, 0.25 vCPU and roughly ten seconds of average drain:
~720 executions/day ≈ **54,000 vCPU-seconds/month — inside the free grant**.
Jobs incur no charge when not executing.

This works only because resource production is **elapsed-time accrual, not
ticks** ([ADR-0003](0003-persistence.md)). Due jobs exist solely for discrete
completions, so job volume tracks player decisions rather than player count
multiplied by time.

### Cost controls

- **Prompts 1–28 are entirely local.** First Azure spend is Prompt 29.
- API `minReplicas` 0 outside test windows.
- **PostgreSQL stopped between test sessions** (up to 7 days).
- ghcr.io instead of ACR Basic (−$5/month).
- Log Analytics daily cap; Application Insights sampling.
- **Budget $10/month and $80 total, alerts at 50 / 80 / 100 %.**
- Teardown script in the runbook.
- **Banned without explicit approval:** Front Door, APIM, Azure SignalR Service,
  Redis Cache, AKS, Service Bus, premium storage, zone-redundant anything.

Rough closed-test month: PostgreSQL ≈ $13–15, storage ≈ $2–4, Container Apps
≈ $0–3, logs ≈ $0 → **roughly $18–22/month**. Order-of-magnitude estimates to
re-verify with the Azure pricing calculator at Prompt 29.

### Testing pyramid

| Layer | Tools | Covers |
|---|---|---|
| Domain unit | xUnit v3, Shouldly | Invariants, state machines, ledger arithmetic |
| Architecture | NetArchTest / ArchUnitNET | Dependency direction, **Runes unreferenced by tiers 0–3**, simulation purity, banned APIs |
| Simulation | xUnit, CsCheck, BenchmarkDotNet | Golden byte-equality, property, determinism, benchmarks |
| Persistence | **Testcontainers + real PostgreSQL 18** | Migrations, double-spend, two-worker single-apply, lease expiry, reconciliation, no FK permanent→seasonal |
| API contract | `WebApplicationFactory` + Testcontainers | Route shape, ETag/304/412, problem-details, idempotency replay |
| Frontend | Vitest, Testing Library, MSW | Components, hooks, typed adapters |
| E2E | Playwright | Mocked stack (Prompt 8), real stack (Prompt 18) |
| Content | `Woo.Content.Validator` | Schema, IDs, cross-refs, terminating fallbacks |
| Accessibility | axe-core via Playwright | Key screens |

**No test sleeps** — `TestClock` advances explicitly. **Integration tests use
real PostgreSQL, never an in-memory provider**, because the behaviours under
test are `SKIP LOCKED`, `xmin` and transaction semantics, none of which an
in-memory provider has.

### CI and deployment stages

**`validate.yml`** on PR and `master`: `dotnet format --verify-no-changes` →
`dotnet build -c Release` (warnings as errors) → unit/architecture/simulation
tests → persistence and API integration tests → `npm ci`, `typecheck`, `lint`,
`test`, `build` → `content:validate` → gitleaks → docker build (no push).

**`publish.yml`** on `master`: build and push images to ghcr.io tagged with the
git SHA.

**`deploy.yml`**: `workflow_dispatch` **only**, gated by a GitHub Environment
approval. Runs the migrate job, updates the revision, smoke-tests
`/healthz/ready`.

**No automatic deployment**, ever. CI uses the same commands as local
development.

### Backup and recovery

Automated backups, 7-day retention, geo-redundancy off. **Restore is a drill,
not a claim** — `docs/operations/RESTORE.md` documented restoring to
a new server, running ledger reconciliation, comparing history counts, and
cutting over. Prompt 28 requires it **executed**.

Assets are content-addressed and reproducible from the repository, so they need
no separate backup.

**Closed-test objectives: RPO ≤ 24 h, RTO ≤ 4 h.** Modest and honest, stated so
nobody assumes production-grade continuity.

## Alternatives considered

### Always-on worker Container App

Rejected on cost: roughly 648,000 vCPU-seconds/month against a 180,000 free
grant. The scheduled job delivers the same durability with a one-to-two minute
completion latency that is invisible in this game.

### Azure Container Registry Basic

Rejected. ghcr.io is free and Container Apps pulls from it happily. ACR Basic
remains the documented fallback if private-pull authentication becomes awkward.

### Azure App Service instead of Container Apps

Rejected. No scale-to-zero on the tiers that matter, and no native scheduled-job
primitive, so the worker would need WebJobs or a Function — a second hosting
model to learn and operate.

### Azure Functions for background work

Rejected. The worker shares the Application and Infrastructure assemblies with
the API by design ([ADR-0001](0001-platform-and-runtime-shape.md)); a Functions
host would add a distinct programming model and a distinct local development
story for no gain.

### A single VPS running Docker Compose

Genuinely competitive on cost and simplicity, and it remains the documented
fallback if credit runs out. Rejected as the primary target because the product
owner has the student credit available, Container Apps gives scale-to-zero and
managed TLS without server administration, and managed PostgreSQL provides
backups and patching that a VPS would make manual. **Portability is preserved
precisely so this stays a real option.**

### Terraform instead of Bicep

Rejected. Terraform needs somewhere to keep state — another resource, another
decision. Bicep is Azure-native, needs no state backend, and the infrastructure
is deployment-only.

### In-memory database for integration tests

Rejected. It cannot test `FOR UPDATE SKIP LOCKED`, `xmin` concurrency or real
transaction semantics — which is most of what the integration tests exist to
prove.

### Auto-deploy on merge to `master`

Rejected. The agent contract forbids deploying without explicit authorization,
and manual gating enforces it in the pipeline rather than in a person's memory.

## Consequences

**Positive**

- Nothing is spent until Prompt 29; the credit stays available for the test that
  matters.
- The worker costs nothing when idle.
- Local development needs no cloud account at all.
- One `IObjectStore` adapter is the only Azure-specific code, so Compose or a
  VPS remain real migration targets.
- Integration tests exercise the real database behaviours the design depends on.

**Negative / accepted costs**

- One-to-two minutes of completion latency in the cloud configuration.
- Testcontainers makes integration tests slower and requires Docker on CI
  runners. `ubuntu-latest` provides it.
- Manual deploy gating means a human in the loop for every release. Intended.
- Cost figures are estimates until Prompt 29 verifies them for the chosen
  region.

**Neutral**

- Bicep is Azure-specific, but it describes deployment rather than the
  application.

## References

- `ARCHITECTURE.md §12`, `§13`, `§14` — sections of the Prompt 1 architecture
  document, replaced by [ADR-0014](0014-local-development-and-ci.md)
- `docs/operations/COST.md`, `RUNBOOK.md`, `RESTORE.md` — deleted with this
  ADR's supersession; they described infrastructure that was never provisioned
- Workbase §19; Prompt 28, Prompt 29
