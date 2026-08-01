# ADR-0006 — Module boundaries and progression order

**Status:** Accepted
**Date:** 1 August 2026

---

## Context

The Workbase names two opposing product risks:

- *"The game feels like a Travian clone before runes"* — the distinctive promise
  arrives too late.
- *"Runes arrive too early"* — medieval weapons and settlement growth become
  irrelevant.

The implementation contract resolves the tension by ordering the work: prove
*Foundations of Iron* (Prompts 5–18) before building *First Flame*
(Prompts 19–24). But ordering prompts does not, by itself, stop rune concepts
leaking into foundation code. Once a `RuneId` appears on an equipment aggregate
"just for later", the medieval slice can no longer be reasoned about, tested or
demonstrated independently.

A second question: ordinary forging and Runeforging both produce a weapon from
inputs and a smith. Should they share a model?

## Decision

### Tiered modules, arrows down only

| Tier | Modules |
|---:|---|
| 0 | Content, Assets, Identity, History |
| 1 | Houses, Settlements, Resources, Workforce, Specialists |
| 2 | Construction, Forge, Equipment, Armies |
| 3 | Battles, Contracts, Markets |
| **4** | **Runes** |
| 5 | Situations, Orders, Warfronts |

A module may depend on lower tiers. Never on a higher one.

### The removability test

> **No module in tiers 0–3 may reference `Woo.*.Runes`. Deleting the Runes
> module must leave the Foundations of Iron slice compiling and green.**

Enforced by NetArchTest from Prompt 2. This is the mechanical guarantee behind
"medieval first" — leakage becomes a failing build rather than a review comment
someone might miss.

**Forge must never depend on Runes.** Runes depends on Forge, Equipment and
Settlements (the Vault). That direction is what lets Prompt 21 add Runeforging
as pure addition rather than surgery.

### Published contracts only

Each module exposes commands, queries and events in `Module/Contracts/`.
Architecture tests assert no module references another's internal namespaces or
domain entities.

### Ordinary forging and Runeforging are separate domain concepts

**`ForgeCraft`** (Forge module, Prompt 12) is deterministic: transparent
duration, guaranteed quality floor, **no probability vocabulary anywhere in its
model**. It persists inputs, technique, smith, `rules_version`,
`content_version` and maker provenance so an old batch stays explainable.

**`RuneforgingAttempt`** (Runes module, Prompt 21) has a probability snapshot, a
seed reference, a failure ladder (clean success, scarred success, rejection,
fracture, catastrophe) and explicit consumed, survived, damaged and destroyed
sets.

They share **infrastructure only**: the generic idempotency sealing of
[ADR-0004](0004-consistency-and-durable-work.md).

### Anticipated but dormant

| Anticipation | In place from |
|---|---|
| `EquipmentBatch` and `NamedItem` as distinct aggregates with no conversion path | Prompt 3 |
| Rune vessel as an additive `VesselCapability` on `NamedItem` | Prompt 3 shape |
| `RuneInstance` with `Destructibility { Destructible, Singular }`, where **`Singular → Destroyed` has no transition** | Prompt 3 |
| `WeaponLevel`, resonance and deed columns — nullable, unread | Prompt 3 |
| Rune families, fusion compatibility and Aura metadata in content schemas behind `enabled: false` | Prompt 3 |

## Alternatives considered

### A single shared "risk attempt" aggregate for crafting and Runeforging

**Rejected — this was an error in an earlier draft.** The argument for it was
appealing: reusing one aggregate would exercise the one-outcome machinery from
Prompt 12, nine prompts before a rune is at stake.

But it conflates a domain concept with an infrastructure concern. The Workbase
is explicit that ordinary forging "uses transparent calculations and a
guaranteed result floor" and that "a player should not lose ordinary client
materials to hidden random quality" (§8). Modelling a guaranteed craft as a
degenerate risk attempt puts probability vocabulary, failure classes and
survival sets into a system that must never have them — and invites a later
change to make ordinary forging "slightly risky" because the field is already
there.

The genuine benefit — early exercise of one-outcome retry integrity — is
obtained anyway, because idempotency sealing is generic infrastructure used by
every mutating command from Prompt 9. Nothing is lost by keeping the domain
concepts separate.

### One module per bounded context with no tiers

Rejected. Flat modules with "just don't reference upward" as a convention is
exactly what fails under deadline pressure. The tier graph makes the rule
testable.

### Putting Runes at tier 2 alongside Forge

Rejected. Runes needs Forge, Equipment and the Vault. Placing them at the same
tier permits a cycle, and a cycle destroys the removability test.

### Deferring the rune schema entirely until Prompt 20

Rejected. The Workbase requires that "the rune model must exist in architecture
and schemas from the start" (§19). Retrofitting singular-object protection and
destructibility policy into a live schema after players hold named weapons is
exactly the migration nobody wants to perform.

### Separate deployable services per module

Rejected in [ADR-0001](0001-platform-and-runtime-shape.md).

## Consequences

**Positive**

- "Medieval first" is a build constraint, not an intention.
- The Foundations of Iron slice can be demonstrated, tested and playtested with
  the Runes module physically absent.
- Prompt 21 is additive: a new tier-4 module using published tier-2 contracts.
- Ordinary forging keeps a clean, riskless model that matches the product
  promise.
- Cross-module dependencies are visible in one graph rather than discovered by
  reading imports.

**Negative / accepted costs**

- Published contracts add indirection: a call between modules goes through an
  interface rather than straight to a repository. This is the cost of the
  boundary and it is small.
- Tier assignment is a judgement call and will occasionally need revisiting. The
  cost of moving a module between tiers is a refactor, caught by the tests.
- Two forging-adjacent models means some duplicated shape (smith, forge,
  duration). Accepted deliberately — the alternative couples a riskless system
  to a risk system.

**Neutral**

- Nullable dormant columns exist in the schema from Prompt 3 without being read.
  Documented, and cheap.

## References

- [`ARCHITECTURE.md §4.4`](../architecture/ARCHITECTURE.md#44-module-tiers)
- [`ARCHITECTURE.md §4.5`](../architecture/ARCHITECTURE.md#45-the-medieval-first-guarantee)
- [`ARCHITECTURE.md §4.6`](../architecture/ARCHITECTURE.md#46-anticipating-runeforging-without-building-it)
- [`SLICES.md`](../architecture/SLICES.md)
- Workbase §8, §18, §22, §24
