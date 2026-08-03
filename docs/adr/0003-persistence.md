# ADR-0003 — Persistence: PostgreSQL, boundaries and access strategy

**Status:** Superseded by [ADR-0013](0013-persistence.md)
**Date:** 1 August 2026

> **Superseded by [ADR-0013](0013-persistence.md) on 3 August 2026.**
> One `WooDbContext` is retained. The six grouped schemas, the `xmin` concurrency token and the raw-SQL job-claiming strategy are not built.
>
> The text below is left unedited as the record of what was designed and
> why it was cut back. Do not treat it as current.

---

## Context

PostgreSQL is the chosen authoritative store (Workbase §19, product owner
decision). What remained open was how many persistence boundaries to create, and
how to access the database.

The system has around twenty modules. A naive reading of "modular monolith"
suggests one `DbContext` and one schema per module. That would produce roughly
eighteen contexts and eighteen schemas before a single feature exists.

The workload has two very different access patterns:

- **Writes** are aggregate-shaped, need migrations, and must participate in one
  transaction that can span modules (see [ADR-0004](0004-consistency-and-durable-work.md)).
- **Reads** are projection-shaped — the House Seat report joins across many
  modules — and the due-job claim needs `FOR UPDATE SKIP LOCKED`, which ORMs
  express badly.

## Decision

**PostgreSQL 18** as the sole authoritative store. Local development runs
`postgres:18-alpine`; Azure runs Flexible Server, which supports 18 and creates
new servers at 18.4.

### One DbContext

**One `WooDbContext`.** EF Core configuration is split into per-module
`IEntityTypeConfiguration<T>` classes so the code stays modular, but there is one
model, one connection, one transaction and one migration history.

### Six schemas, grouped by concern

| Schema | Holds |
|---|---|
| `core` | houses, settlements, construction, workforce, specialists |
| `economy` | balances, ledger, reservations, contracts, market orders |
| `forge` | forges, techniques, crafts, equipment batches, named items, and later runes |
| `military` | companies, armies, loadouts, battle snapshots, results, replays |
| `world` | situations, orders, warfronts, history, seasons |
| `app` | idempotency keys, due jobs, outbox, content version registry |

Schemas are a **readability aid and a future split seam**, not the enforcement
mechanism. Module ownership is enforced in code by architecture tests
([ADR-0006](0006-module-boundaries-and-progression-order.md)).

### Access strategy

| Concern | Technology |
|---|---|
| Aggregate writes, model, **migrations** | EF Core 10 with Npgsql 10 |
| Optimistic concurrency | `xmin` as concurrency token → `412` on conflict |
| Ledger-critical spend paths | Explicit `SELECT … FOR UPDATE` |
| **Due-job claiming** | **Raw SQL** — `FOR UPDATE SKIP LOCKED` |
| Read models, projections, reconciliation | **Raw SQL** — no change tracking in hot reads |

### Conventions

- `snake_case`; UUIDv7 primary keys; `timestamptz` with a `_utc` suffix; UTC
  everywhere.
- **Integers only for money and quantities** (`bigint`, gold in the smallest
  unit). No floating point in the economy or in authoritative simulation
  arithmetic.
- Every mutating table carries `created_at_utc`, `updated_at_utc`,
  `correlation_id`.
- Enum-like values are `text` with a `CHECK` constraint.

### Migrations

EF Core migrations applied by a dedicated migrator entrypoint. **Never
auto-migrate on API start in production.** Expand → migrate → contract for
breaking changes. Long backfills run as due jobs, never inside a migration.
Forward-fix over rollback; `Down()` retained for development only.

## Alternatives considered

### One DbContext and one schema per module (~18 of each)

Rejected. It would multiply configuration and migration surface before any
feature existed, and it fights the single-transaction rule directly: a command
that spends resources and starts construction would need either a shared
connection with manual transaction enlistment across contexts, or a distributed
transaction. The claimed benefit — enforced ownership — is delivered better and
more cheaply by architecture tests over code.

**Revisit when:** a schema group shows genuine contention, deploy coupling, or
an ownership dispute that code-level tests cannot settle.

### EF Core for everything

Rejected, narrowly. It is simpler and would work. But the due-job claim is the
heart of the durable-work design, `FOR UPDATE SKIP LOCKED` has no clean EF
expression, and House Seat projections joining a dozen tables are exactly where
a change tracker becomes a liability. The hybrid confines raw SQL to the two
places it is clearly better and keeps EF's migrations and model checking
everywhere else.

### Dapper with hand-written SQL migrations

Rejected. Full control over SQL, but it costs EF migrations and requires
adopting DbUp, FluentMigrator or Grate plus hand-written schema. More upfront
work and more ongoing ceremony than the problem justifies, given the owner's
familiarity with EF.

### A document store or event sourcing

Rejected. The invariants are relational and transactional — ledgers reconciling,
exclusive destinations, uniqueness of singular objects. Event sourcing would add
a projection-rebuild burden and a learning cost with no matching benefit at this
scale. Note that the ledger is already append-only and the outbox already
records domain events, so the auditability benefits are largely obtained without
the machinery.

### PostgreSQL 17 instead of 18

Rejected. 18 is stable since September 2025, supported to November 2030, and is
what Azure Flexible Server creates by default. Choosing 17 would shorten the
support runway for no gain. Note that `io_method = io_uring` is unavailable on
Azure's PG 18 — irrelevant to this workload.

## Consequences

**Positive**

- One transaction spans modules naturally, which is what the economy requires.
- One migration history to reason about and one to apply.
- Raw SQL sits exactly where an ORM is the wrong tool, and nowhere else.
- Schemas make support queries and a future extraction obvious.
- `xmin` concurrency tokens come free with Npgsql — no version column to
  maintain.

**Negative / accepted costs**

- One `DbContext` grows large. Mitigated by per-module configuration classes and
  by the architecture tests that keep entity access inside its owning module.
- Two access technologies means two idioms to learn. Bounded by confining raw
  SQL to job claiming, projections and reconciliation.
- Integer-only money means unit conversion at the presentation edge. Accepted —
  floating-point money in a game with a ledger is not negotiable.

**Neutral**

- Schema grouping is a judgement call. Moving a table between schemas is a
  migration, not a redesign.

## References

- [`ARCHITECTURE.md §6`](../architecture/ARCHITECTURE.md#6-postgresql-boundaries-conventions-migrations-concurrency)
- [`ARCHITECTURE.md §15.2`](../architecture/ARCHITECTURE.md#152-economy)
- [ADR-0004](0004-consistency-and-durable-work.md) — why one transaction matters
