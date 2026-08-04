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

## Current decisions

| # | Decision | Status |
|---|---|---|
| [0011](0011-minimal-platform-shape.md) | **Minimal platform shape** — one ASP.NET Core 10 application with feature folders; no worker, no durable-job engine, no outbox, no architecture-test framework; `/api/v1` retained | Accepted |
| [0012](0012-frontend-stack.md) | **Frontend stack** — React 19, Vite 8 and **one** plain `typescript@6.0.3`; no compiler alias pair, no PixiJS | Accepted, **partly superseded by [0015](0015-frontend-routing-and-tests.md)** |
| [0015](0015-frontend-routing-and-tests.md) | **Frontend routing, test runner and the Node floor** — a project-owned History-API router instead of React Router (every 7.x release carries a high-severity advisory); Vitest with Testing Library; Node ≥ 22.22.2; the adapter boundary as a lint rule | Accepted |
| [0013](0013-persistence.md) | **Persistence** — PostgreSQL 18, one `WooDbContext`, default schema, EF Core migrations from Prompt 3, explicit transactions, elapsed time as stored timestamps | Accepted |
| [0014](0014-local-development-and-ci.md) | **Local development and CI** — Compose for PostgreSQL only on host port 5433, GitHub Actions for build/test/lint/typecheck, no deployment or infrastructure code | Accepted |
| [0016](0016-settlement-terminology.md) | **Settlement terminology** — the player's domain is a Settlement, not a House; `House` and `Settlement` merge into one aggregate; the outpost carries no proper name; the Workbase and prompt sheet keep their own wording | Accepted |
| [0017](0017-commands-over-the-settlement-state-seam.md) | **Commands over the settlement state seam** — commands sit beside `load` and return the whole resulting state; no optimistic updates; the source re-checks and is authoritative; commands name intent, never amounts; duplicates are rejected, not ignored | Accepted |
| [0018](0018-forging-state-machine-and-exclusive-destination.md) | **The forging state machine and the exclusive destination** — `ForgeCraft` is a discriminated union, so a batch in two places is unrepresentable; completion resolves on read and the destination is the decision; the batch is exactly the guaranteed quality floor, with no probability vocabulary anywhere; one craft in this slice, because a second would overwrite the batch | Accepted |

## Superseded by the Prompt 2 correction

The Prompt 1 architecture designed for the finished game rather than the first
slice. None of the machinery below was ever built, so nothing was rolled back —
but the reasoning is kept, because a design that ran ahead of its product is
worth being able to re-read.

| # | Decision | Superseded by |
|---|---|---|
| [0001](0001-platform-and-runtime-shape.md) | Platform and runtime shape — API plus a separate .NET worker | [0011](0011-minimal-platform-shape.md) |
| [0002](0002-frontend-stack.md) | Frontend stack with the TypeScript 7 + 6 compiler pair | [0012](0012-frontend-stack.md) |
| [0003](0003-persistence.md) | Persistence — six grouped schemas, `xmin` concurrency, raw-SQL job claiming | [0013](0013-persistence.md) |
| [0004](0004-consistency-and-durable-work.md) | Consistency and durable work — due jobs, leases, outbox, idempotency sealing | [0011](0011-minimal-platform-shape.md) |
| [0005](0005-determinism.md) | Determinism — `IClock`, project-owned PCG, banned-API analyzer, battle contract | [0013](0013-persistence.md) *(deferred to Prompt 14)* |
| [0006](0006-module-boundaries-and-progression-order.md) | Module boundaries — eight assemblies, tier graph, Runes-removability test | [0011](0011-minimal-platform-shape.md) *(deferred)* |
| [0007](0007-content-and-assets.md) | Authored content and assets — versioned JSON, retention registry, asset manifest | [0014](0014-local-development-and-ci.md) |
| [0008](0008-api-and-access-boundary.md) | API and access boundary — ETag concurrency, poll hints, `ActorContext` | [0011](0011-minimal-platform-shape.md) *(partly retained)* |
| [0009](0009-permanent-versus-seasonal-data.md) | Permanent versus seasonal data — `season_id`, no permanent → seasonal foreign key | [0013](0013-persistence.md) *(deferred to Prompt 27)* |
| [0010](0010-environments-delivery-and-cost.md) | Environments, delivery and cost — Azure Container Apps, Bicep, budgets, restore | [0014](0014-local-development-and-ci.md) |

---

## Decisions with a named revisit threshold

| Deferred or rejected | Revisit when | ADR |
|---|---|---|
| Separate worker process | In-process work measurably cannot complete safely at request time | [0011](0011-minimal-platform-shape.md) |
| Durable jobs, outbox, idempotency keys | An action cannot be resolved from stored timestamps on read, or a post-commit reaction must survive a crash | [0011](0011-minimal-platform-shape.md) |
| Architecture tests and assembly boundaries | The module count makes review-based enforcement unreliable | [0011](0011-minimal-platform-shape.md) |
| TypeScript 7 | 7.1 ships with a programmatic API **and** `typescript-eslint` supports it | [0012](0012-frontend-stack.md) |
| PixiJS | Prompt 7, the first battle replay | [0012](0012-frontend-stack.md) |
| ~~Frontend test runner~~ | **Done at Prompt 5** — Vitest | [0015](0015-frontend-routing-and-tests.md) |
| React Router | Routing needs loaders, route params, nested layouts or code-splitting — **or** a 7.x release lands with a clean audit | [0015](0015-frontend-routing-and-tests.md) |
| More schemas or more `DbContext`s | Measured contention or a real ownership dispute | [0013](0013-persistence.md) |
| Clock abstraction and project-owned PRNG | Prompt 14, the first simulation code | [0013](0013-persistence.md) |
| Permanent/seasonal schema boundary | Prompt 27, when seasons exist | [0013](0013-persistence.md) |
| Versioned content and asset manifest | There is authored content to validate | [0014](0014-local-development-and-ci.md) |
| Object storage | The art library outgrows shipping with the application | [0014](0014-local-development-and-ci.md) |
| Azure, Bicep, deployment, backup and restore | A local playable slice exists and deployment is authorised | [0014](0014-local-development-and-ci.md) |
| OpenTelemetry | Operating a real shared environment (Prompt 28) | [0014](0014-local-development-and-ci.md) |
| gitleaks in CI | Widening CI scope is itself a change worth making deliberately | [0014](0014-local-development-and-ci.md) |
| Redis, message broker, Kubernetes, microservices | Not foreseen at this scale; each needs measurement, not preference | [0011](0011-minimal-platform-shape.md) |

---

## The Prompt 2 correction, in one paragraph

Prompt 1 answered "what architecture does this game need?" The right question
was "what is the smallest thing that can prove the first slice?" The gap between
those two answers was a worker process, a job engine, an outbox, an object
store, six schemas, a cloud topology and a second TypeScript compiler. The
lesson worth keeping: an architecture document describing infrastructure nobody
has run is a prediction, not a decision.
