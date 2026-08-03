# ADR-0013 — Persistence: PostgreSQL, one context, timestamps over timers

**Status:** Accepted
**Date:** 3 August 2026
**Supersedes:** [ADR-0003](0003-persistence.md),
[ADR-0005](0005-determinism.md),
[ADR-0009](0009-permanent-versus-seasonal-data.md)

---

## Context

PostgreSQL and a single `WooDbContext` were the right calls in ADR-0003 and are
kept. What went too far was everything built on top of them before there was a
single table: six named schemas grouped by bounded concern, `xmin` as a
concurrency token surfaced as HTTP `412`, raw-SQL job claiming, a ledger DDL, a
`season_id` convention with a catalog test asserting no foreign key points from
permanent to seasonal tables, and a determinism package (`IClock`, a
project-owned PCG generator, a banned-API analyzer) for simulation code that
does not exist.

Prompt 2's scope is connectivity. Prompt 3 writes the first entities. Deciding
the shape of the ledger and the seasonal boundary now would be deciding them
without the domain model that gives them meaning.

## Decision

**PostgreSQL 18, one `WooDbContext`, the default `public` schema, EF Core
migrations, explicit transactions, and elapsed time modelled as stored
timestamps.**

1. **One context, one model, one connection, one migration history.** A context
   per feature would make the ordinary cross-feature command — spend resources
   *and* start construction *and* write the ledger entry — awkward to hold in
   one transaction, which is exactly the property the economy depends on.
2. **Default schema.** The six-schema grouping was a readability aid and a
   future split seam. Moving a table between schemas is a migration, not a
   redesign, so the decision can be made later with real tables in hand.
3. **No entities yet.** The context is empty. The first entities and the first
   migration arrive in Prompt 3 with the Foundations of Iron domain model. A
   test asserts the model is empty, so gameplay cannot arrive unnoticed.
4. **Transactions are explicit.** `SaveChangesAsync` is one transaction; a
   multi-step command opens one with `Database.BeginTransactionAsync`. All or
   nothing.
5. **Elapsed time is a stored timestamp, not a timer.** A row records when work
   started and when it completes; progress is computed on read; a write settles
   the elapsed effect first. **No per-House task, no scheduler, no job row.**
6. **Concurrency control, ledger shape, and the permanent/seasonal boundary are
   deferred** to the prompts that build them (9, 10 and 27). They remain
   recorded product invariants in
   [`ARCHITECTURE.md §9`](../architecture/ARCHITECTURE.md#9-product-invariants-to-honour).
7. **Determinism is deferred to Prompt 14.** There is no simulation code, so a
   clock abstraction and a project-owned PRNG have nothing to constrain. The
   requirement itself — reproducible from explicit inputs, rules version and
   seed — is recorded as an invariant.

## Alternatives considered

**Keep the six schemas from the start.** Rejected: it is a naming decision with
no consumers yet. Introducing it alongside the first tables costs the same and
will be better informed.

**Create an initial empty migration now** so the migration pipeline is proven in
Prompt 2. Rejected on the product owner's instruction: a migration whose `Up()`
is empty is a file that exists only to be run, and the pipeline is proven just
as well by the first real migration in Prompt 3.

**Introduce `IClock` now** so tests never sleep. Rejected as premature: nothing
reads the clock except the status endpoint, which takes `TimeProvider` from
dependency injection — the framework's own abstraction, already substitutable.
No project-specific abstraction is needed until simulation code exists.

**A per-feature schema or a context per feature.** Rejected: measured contention
is the trigger, and there is no measurement without tables.

## Consequences

- The database is empty after Prompt 2. Connectivity is proven by opening a
  connection against a real server, locally and in CI.
- `TimeProvider.System` is registered in DI, so anything needing the current
  time already takes it as a dependency rather than calling `DateTime.UtcNow`.
- Prompt 3 owns more decisions than it otherwise would: table naming, key
  strategy, and where the ledger lives. That is the correct place for them.
- No `dotnet-ef` tool manifest exists yet; Prompt 3 adds it along with
  `Microsoft.EntityFrameworkCore.Design` when the first migration is created.

**Revisit when:** the first entities land (Prompt 3, schema and conventions);
concurrent writes can conflict (Prompt 9, concurrency tokens); the economy has
balances (Prompt 10, ledger); seasons exist (Prompt 27).
