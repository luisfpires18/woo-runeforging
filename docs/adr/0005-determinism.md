# ADR-0005 — Determinism: clocks, randomness and the battle contract

**Status:** Superseded by [ADR-0013](0013-persistence.md)
**Date:** 1 August 2026

> **Superseded by [ADR-0013](0013-persistence.md) on 3 August 2026.**
> Deferred rather than replaced. There is no simulation code yet, so the clock abstraction, the project-owned PRNG, the banned-API analyzer and the battle contract have nothing to constrain. Revisit at Prompt 14.
>
> The text below is left unedited as the record of what was designed and
> why it was cut back. Do not treat it as current.

---

## Context

Workbase §19 requires that battle simulation is deterministic from explicit
inputs, rules version and seed, and that replay rendering never calculates the
outcome. Workbase §9 requires that a Runeforging attempt records its formula
version, probability snapshot, inputs, seed reference, result and consequences —
because players must be able to trust the odds, and support must be able to
reconstruct any disputed attempt.

Determinism is not a nice-to-have here. It is the foundation of the product's
fairness promise, which the Workbase names as a top-tier risk: "Runeforging RNG
feels abusive — destruction can erase trust."

Three specific hazards had to be closed:

1. **Ambient time.** A single `DateTime.UtcNow` inside simulation makes a replay
   irreproducible and a test flaky.
2. **Runtime-defined randomness.** `System.Random`'s algorithm is
   implementation-defined and *has changed* between .NET versions. A framework
   upgrade would silently invalidate every stored replay.
3. **A renderer that computes.** If the client derives a number the server did
   not send, two clients can disagree about what happened.

## Decision

### Clock

`IClock { DateTimeOffset UtcNow }`. `SystemClock` in hosts, `TestClock` in tests,
advanced explicitly. **No test sleeps.**

`Microsoft.CodeAnalysis.BannedApiAnalyzers` applies a `BannedSymbols.txt` to
`Woo.Domain` and `Woo.Simulation` banning `System.Random`, `DateTime.Now`,
`DateTime.UtcNow`, `DateTimeOffset.Now`, `DateTimeOffset.UtcNow`,
`Guid.NewGuid`, `Environment.TickCount`, `Thread.Sleep` and `Task.Delay`.

**This is a build error, not a lint warning.**

Identifiers come from `IIdGenerator` wrapping `Guid.CreateVersion7()` — UUIDv7
is time-sortable and gives index locality in PostgreSQL.

### Project-owned randomness

`Woo.Simulation.Random` owns the algorithm:

- **`Pcg32`** — explicit 64-bit state, a documented published algorithm, fixed
  in this repository, covered by golden output vectors.
- **Named stream derivation:** `stream = SplitMix64(rootSeed ^ Fnv1a64(name))`.
  `battle.ranged`, `battle.morale`, `battle.pursuit` and `runeforge.attempt`
  advance independently, so **adding a new stream never shifts an existing
  one's sequence** — a new mechanic cannot invalidate stored replays.
- **Seed provenance:** `rootSeed` is generated once when work is scheduled and
  persisted on the immutable input snapshot. There is no other entropy source
  inside the simulation.

### Battle contract

| Contract | Rule |
|---|---|
| `BattleInput` | Immutable snapshot taken at scheduling. Canonically serialized with stable property order; `InputHash = SHA-256` persisted. Editing a roster afterwards cannot alter a scheduled battle |
| `BattleResult` | Canonical outcome. Byte-equivalent for identical `(input, rulesVersion, seed)` |
| `BattleEventLog` | Ordered events plus `EventLogVersion`. **The only thing the renderer consumes** |
| `BattleExplanation` | Decisive factors derived from the log |

- `Simulate(BattleInput)` is a **pure function** returning all three together.
- **Result application is a separate idempotent transaction** keyed by
  `BattleId`. Simulation and application never share a transaction — this also
  keeps simulation time out of the lock window.
- The client refuses an unknown **major** `EventLogVersion` and degrades to the
  text report rather than mis-rendering.

**Review rule:** if the replay needs a number that is not in the event log, the
fix is to emit it — never to compute it client-side.

## Alternatives considered

### `System.Random` with a fixed seed

Rejected. Seeding makes a run repeatable *on one runtime version*. It does not
survive a .NET upgrade, because the algorithm is explicitly not part of the
contract. Stored replays would break invisibly — the worst possible failure
mode, since nothing would error, the numbers would simply differ.

### `System.Security.Cryptography.RandomNumberGenerator`

Rejected for simulation. Cryptographic quality is irrelevant here and it is not
reproducible by design. It is the right tool for generating the root seed
itself, which is a one-time act outside the simulation.

### Mersenne Twister

Rejected in favour of PCG. Larger state, slower, weaker statistical properties,
and no advantage for this workload. PCG32 is small, fast, well documented and
easy to reimplement if the project ever needs a second language to agree.

### One shared random stream for the whole battle

Rejected. Any change to how often a mechanic draws — a bug fix, a new event
type — shifts every subsequent draw and invalidates all stored replays. Named
streams make the simulation extensible without breaking history.

### Storing only the result, and re-simulating for replay

Rejected. It would make the renderer depend on the simulation, and it would make
replay correctness depend on the simulation binary still being available and
unchanged. Storing the event log decouples the two permanently and lets the
client render without any server round trip beyond fetching the log.

### Storing only the event log, and deriving the result from it

Rejected. The result is the authoritative record applied to state; deriving it
at read time would put game-affecting logic on a read path and risk divergence.
Both are stored; a test asserts they reconcile.

### Floating-point arithmetic in the simulation

Rejected. IEEE-754 results can vary with compiler optimisation and hardware.
Integer arithmetic throughout removes the entire class of problem.

## Consequences

**Positive**

- A stored battle replays identically on any client, on any machine, at any
  time.
- A disputed Runeforging attempt can be fully reconstructed from persisted
  inputs, formula version and seed.
- Tests are fast and never flaky — hours of game time pass in microseconds.
- The fairness promise ("no hidden modifier") is verifiable rather than
  asserted, because the probability snapshot is stored and shown.

**Negative / accepted costs**

- Owning a PRNG means owning its correctness. Mitigated by golden vectors
  against the published PCG reference.
- Banned APIs occasionally require a small port where an ambient call would have
  been convenient. This is the point.
- Canonical serialization needs care — property order, culture-invariant
  formatting, no `HashSet` iteration order. Covered by the golden test, which
  fails loudly if any of it drifts.
- Storing event logs costs space. Bounded by the closed-test scale; a retention
  policy is a later operational concern.

**Neutral**

- `EventLogVersion` means the client carries compatibility logic. Kept simple:
  render known majors, degrade otherwise.

## References

- [`ARCHITECTURE.md §5`](../architecture/ARCHITECTURE.md#5-determinism-clocks-randomness-battle-and-replay)
- [`ARCHITECTURE.md §15.4`](../architecture/ARCHITECTURE.md#154-determinism-and-one-outcome)
- Workbase §9 "Retry integrity", §11, §19
