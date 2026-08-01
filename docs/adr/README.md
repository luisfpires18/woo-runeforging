# Architecture decision records

Each ADR records one decision, why it was made, what was rejected, and what
would change it. They are written to stand alone — you should be able to read
one without reading the others.

**Format:** Status · Context · Decision · Alternatives considered · Consequences
· References.

**Rules**

- An accepted ADR is not edited to reflect a new decision. Write a new ADR that
  supersedes it, and mark the old one `Superseded by ADR-XXXX`.
- Corrections of fact (a wrong version number, a broken link) may be edited in
  place.
- If a decision has a revisit threshold, state it in the ADR. A rejection
  without a named trigger is an opinion, not a decision.

---

## Index

| # | Decision | Status |
|---|---|---|
| [0001](0001-platform-and-runtime-shape.md) | **Platform and runtime shape** — ASP.NET Core 10 modular monolith plus a .NET worker; Option A versus Next.js Option B; why not microservices, Kubernetes, Redis or a broker | Accepted |
| [0002](0002-frontend-stack.md) | **Frontend stack** — React 19, Vite 8, TypeScript 7 under `@typescript/native` with TypeScript 6 under `typescript`, PixiJS isolated from simulation | Accepted |
| [0003](0003-persistence.md) | **Persistence** — PostgreSQL 18, one `WooDbContext`, six grouped schemas, EF Core for writes and migrations with raw SQL for reads and job claiming | Accepted |
| [0004](0004-consistency-and-durable-work.md) | **Consistency and durable work** — synchronous same-transaction cross-module calls; outbox strictly for post-commit reactions; due jobs with `SKIP LOCKED`; generic idempotency sealing | Accepted |
| [0005](0005-determinism.md) | **Determinism** — `IClock`, project-owned PCG with named streams, seed provenance, banned-API analyzer, the battle contract, replay never computes | Accepted |
| [0006](0006-module-boundaries-and-progression-order.md) | **Module boundaries and progression order** — tiers, the Runes-removability test, and `ForgeCraft` kept separate from `RuneforgingAttempt` | Accepted |
| [0007](0007-content-and-assets.md) | **Content and assets** — versioned JSON with JSON Schema, stable string IDs, reference-driven version retention, terminating asset fallbacks | Accepted |
| [0008](0008-api-and-access-boundary.md) | **API and access boundary** — REST `/api/v1`, problem-details, ETag concurrency, polling with a server-computed hint, the authorization boundary without authentication | Accepted |
| [0009](0009-permanent-versus-seasonal-data.md) | **Permanent versus seasonal data** — a stable seasonal schema with `season_id`, no foreign key from permanent to seasonal, archival as an audited job | Accepted |
| [0010](0010-environments-delivery-and-cost.md) | **Environments, delivery, testing and cost** — Docker Compose locally, Azure Container Apps topology, the testing pyramid, CI gates, backup and cost controls | Accepted |

---

## Decisions with a named revisit threshold

These are the rejections most likely to need reopening. Each names the
measurement that would justify it.

| Rejected | Revisit when | ADR |
|---|---|---|
| Redis | Sustained job throughput above ~50/second, or a profiled cross-process cache need | [0001](0001-platform-and-runtime-shape.md), [0004](0004-consistency-and-durable-work.md) |
| Message broker | Fan-out to independently deployed consumers, or cross-service ordering guarantees | [0001](0001-platform-and-runtime-shape.md), [0004](0004-consistency-and-durable-work.md) |
| Kubernetes | Multi-region, or more than ~10 services with independent lifecycles | [0001](0001-platform-and-runtime-shape.md) |
| Microservices | A module demonstrates an independent scaling or release need under measurement | [0001](0001-platform-and-runtime-shape.md) |
| Push (SignalR) | More than ~200 concurrent players, or a feature needing sub-second shared state | [0008](0008-api-and-access-boundary.md) |
| The TypeScript compiler pair | TypeScript 7.1 GA **and** `typescript-eslint` releasing TypeScript 7 support | [0002](0002-frontend-stack.md) |
| More persistence boundaries | Measured contention, deploy coupling, or an ownership dispute code tests cannot settle | [0003](0003-persistence.md) |
| Content in the database | Balance iteration during a live test proves too slow | [0007](0007-content-and-assets.md) |
| Azure over a VPS | Credit exhaustion, or the managed services stop earning their cost | [0010](0010-environments-delivery-and-cost.md) |

---

## Corrections made during Prompt 1 review

Three decisions in the first architecture draft were wrong and were corrected
before acceptance. They are recorded here because each is a mistake worth not
repeating.

| Draft error | Correction | ADR |
|---|---|---|
| `typescript` aliased to TypeScript 7 and `@typescript/native` to TypeScript 6 | **Reversed.** Tools resolve the bare `typescript` specifier through peer dependencies, so that name must hold the package with a programmatic API — TypeScript 6 | [0002](0002-frontend-stack.md) |
| Cross-module writes routed through domain events and the outbox | **Corrected.** Anything whose failure must undo the decision is synchronous and in the same transaction. The outbox is for post-commit reactions only | [0004](0004-consistency-and-durable-work.md) |
| Ordinary forging modelled as a shared `RiskAttempt` aggregate | **Separated.** `ForgeCraft` is deterministic with no probability model; `RuneforgingAttempt` is its own concept. They share idempotency infrastructure only | [0006](0006-module-boundaries-and-progression-order.md) |
| Dynamic `season_<n>` schemas dropped with `DROP SCHEMA CASCADE` | **Replaced** with a stable schema and `season_id`, keeping seasonal tables inside migrations and the EF model | [0009](0009-permanent-versus-seasonal-data.md) |
| A fixed cap of two loaded content versions | **Replaced** with reference-driven retention — every live-referenced version stays loadable, and startup fails if one is missing | [0007](0007-content-and-assets.md) |
