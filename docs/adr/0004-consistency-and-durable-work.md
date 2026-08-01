# ADR-0004 — Consistency, durable work and idempotency

**Status:** Accepted
**Date:** 1 August 2026

---

## Context

The game's core loop is asynchronous: construction, training, crafting, travel
and battles complete on a timer while the player is away. Workbase §19 requires
that gold and goods movements are transactional and ledgered, that a confirmed
Runeforging attempt has exactly one outcome under retries, and that battle
results cannot be applied twice.

The implementation contract adds that concurrent requests, retries, worker
restarts and duplicate delivery are **normal operating conditions**, not edge
cases.

Two questions had to be settled precisely, because getting either wrong
corrupts the economy in ways that are hard to detect and harder to repair:

1. **How do modules interact** when one command touches several of them?
2. **How is background work made durable** without a broker?

An early draft proposed routing cross-module writes through domain events and
the outbox. That is wrong: "spend resources and start construction" must be
atomic. If the spend commits and the construction insert fails, the player has
paid for nothing.

## Decision

### 1. The cross-module rule

> **If a failure must undo the decision, it is a synchronous call inside the
> same database transaction. If a failure only needs retrying later, it is an
> outbox event.**

| Interaction | Mechanism |
|---|---|
| Spend resources · start construction · reserve a worker · write the ledger entry | **One synchronous transaction** |
| Confirm a craft · consume reservations · create the batch · ledger the cost | One synchronous transaction |
| Apply a battle result: casualties, equipment, rewards, ownership | One synchronous transaction, sealed by `BattleId` |
| Runeforging: seal the outcome · consume inputs · set rune and vessel state · settle fees | One synchronous transaction |
| Append history · refresh projections · emit a report · schedule a follow-up · telemetry · notify an Order | **Outbox**, post-commit |

Synchronous cross-module calls go through the **published contract interface**
in `Module/Contracts/` — never another module's repository or entities.

**The outbox never maintains an invariant.** A cross-module invariant needing
eventual consistency would be a design smell at this scale, and is raised in
review rather than absorbed.

### 2. Durable jobs on PostgreSQL

```sql
UPDATE app.due_job
   SET state = 'leased', lease_owner = @owner,
       lease_expires_utc = now() + @lease, attempts = attempts + 1
 WHERE id IN (SELECT id FROM app.due_job
               WHERE state = 'pending' AND due_at_utc <= now()
               ORDER BY due_at_utc
                 FOR UPDATE SKIP LOCKED
               LIMIT @batch)
RETURNING *;
```

- **Bounded leases.** An expired lease is reclaimed by the same predicate, so a
  crashed worker self-heals with no operator action.
- **Retry** with exponential backoff by rewriting `due_at_utc`; after N attempts
  the row becomes `poison`, surfaced in an operator view and a metric.
- **No operating-system timer per task.** One polling loop.
- **Graceful shutdown**: an in-flight job either commits or lets its lease
  expire. `replicaTimeout` is configured above the drain window.

### 3. Generic command sealing

```
app.idempotency_key (key text primary key, house_id, endpoint,
                     request_hash, response_body jsonb, created_at_utc)
```

Every mutating command carries an `Idempotency-Key`, inserted **in the same
transaction as the effect**. A duplicate violates the primary key and the stored
response is returned.

This one mechanism serves construction start, craft confirmation, exclusive
destination choice, battle application and — from Prompt 21 — Runeforging
confirmation. "A duplicate command does not double-spend" and "a duplicate
confirmation returns the original attempt" are **the same infrastructure**
applied to different domain concepts.

Crucially, this means the retry-integrity mechanism that Runeforging depends on
is exercised in production paths from Prompt 9, across ordinary construction and
crafting, long before a rune is at stake.

### 4. Transactional outbox

Written in the same transaction as the change that produced it; dispatched
post-commit to in-process handlers. At-least-once delivery, with
`app.outbox_consumed (outbox_id, handler)` making handlers idempotent.

## Alternatives considered

### Events and the outbox for all cross-module writes

**Rejected — this was an error in an earlier draft.** It would make "spend and
build" eventually consistent, which means a window in which the player has paid
and received nothing. Recovering from a failed reaction would require
compensating transactions, which are strictly harder to get right than a
transaction that simply rolls back. The rule above exists specifically to
prevent this from creeping back in.

### A message broker (Service Bus, RabbitMQ, Kafka)

Rejected. One process consumes the outbox. A broker adds delivery semantics the
outbox already provides, plus a service to operate and pay for.

**Revisit when:** fan-out to independently deployed consumers, or cross-service
ordering guarantees.

### Redis-backed queues

Rejected. `SKIP LOCKED` on PostgreSQL handles orders of magnitude more than this
workload, and keeping jobs in the same database as the state means a job and its
effect commit together — which a separate queue cannot offer without
two-phase commit or an outbox anyway.

**Revisit when:** sustained throughput above roughly 50 jobs/second.

### Hangfire or Quartz.NET

Rejected. Both are capable, but both bring their own schema, their own
serialization and their own retry semantics, and neither participates in *our*
transaction the way a table we own does. The claim protocol here is roughly
thirty lines of SQL and is exactly the behaviour the acceptance tests need to
assert.

### One timer per scheduled task

Rejected explicitly by the implementation contract, and correctly: timers do not
survive restart, do not coordinate across replicas, and do not produce an
auditable record of what was due and when.

## Consequences

**Positive**

- The economy cannot be left half-applied by a partial failure.
- Restarting either process loses no committed work; expired leases recover
  automatically.
- Duplicate delivery and client retries are safe by construction.
- One mechanism to understand, test and operate, rather than one per feature.
- No additional infrastructure to run or fund.

**Negative / accepted costs**

- Synchronous cross-module calls create compile-time coupling between modules.
  Bounded by the published-contract rule and the tier graph in ADR-0006.
- A long transaction holds locks. Mitigated by keeping simulation *outside* the
  transaction — a battle is simulated first, then applied in a short
  transaction.
- Polling the job table costs a query every cadence interval even when idle.
  Negligible, and the cadence is a documented tuning knob.
- At-least-once outbox delivery means handlers must be idempotent. Enforced by
  `outbox_consumed` and asserted in tests.

**Neutral**

- Job latency is bounded by the worker cadence — one to two minutes in the cloud
  configuration. Invisible in an asynchronous strategy game, and tunable.

## References

- [`ARCHITECTURE.md §4.3`](../architecture/ARCHITECTURE.md#43-the-cross-module-interaction-rule)
- [`ARCHITECTURE.md §7`](../architecture/ARCHITECTURE.md#7-durable-jobs-idempotency-and-the-outbox)
- [`ARCHITECTURE.md §15.4`](../architecture/ARCHITECTURE.md#154-determinism-and-one-outcome)
- Workbase §9 "Retry integrity", §19 "Critical technical invariants"
