# ADR-0018 — The forging state machine and the exclusive destination

**Status:** Accepted
**Date:** 4 August 2026

## Context

[ADR-0017](0017-commands-over-the-settlement-state-seam.md) shaped the first
writes in the client: commands on `SettlementStateSource`, each returning the
whole resulting state, naming intent rather than amounts. That carried the
construction half of Prompt 6.

The forging half adds something construction never had: an **outcome** that
outlives the action, and a **decision about that outcome that cannot be taken
back**. A batch of 100 swords is made once and goes to exactly one place, and
later systems read both the batch and where it went.

Three of the prompt's rules bear on this directly — *a craft cannot complete
twice*, *one equipment batch has one current destination*, and *a batch cannot
be equipped and sold simultaneously*. All three were deferred at Prompt 3 for
want of anything to apply them to.

This is still the **mocked** slice. The authoritative forge, its persistence and
its migrations belong to Prompt 12.

## Decision

### 1. `ForgeCraft` is a discriminated union, not a record with flags

```ts
type ForgeCraft =
  | (CraftBase   & { status: 'InProgress';          batch: null })
  | (CraftBase   & { status: 'AwaitingDestination'; batch: EquipmentBatch })
  | (SettledCraft & { destination: 'Equipped' })
  | (SettledCraft & { destination: 'Contracted'; feePaidGold: number })
  | (SettledCraft & { destination: 'Listed';     askingPriceGold: number })
  | (SettledCraft & { destination: 'Retained' });
```

The first draft carried `status` and `destination` as independent fields, which
made `status: 'Equipped'` with `destination: 'Listed'` a value the type allowed
and every reader had to defend against. It is now unrepresentable. So are a
craft that is still at the anvil but has already produced a batch, and an
equipped batch carrying an asking price — each destination-specific field exists
only on the member that can have it.

**Exclusivity is therefore structural.** "The same batch never reaches two
destinations" is a property of the type rather than a rule to police, and
`Settled` has no outgoing transition to write.

Terminal status is `Settled` with `destination` beneath it, rather than four
terminal status names, so later systems read one field that means *where it
went* instead of reinterpreting a status.

### 2. Completion resolves on read; the destination is the decision

`InProgress → AwaitingDestination` happens inside the same read-time settlement
that completes buildings, guarded so it can pass only once. No timer, no job, no
command. `AGENTS.md` §4 prefers stored timestamps resolved on read, and it also
means a finished craft is observable offline while committing stays blocked.

The prompt's *"the complete craft is a decision, not only a timer"* is satisfied
by the **destination** — a required, irreversible, player-made choice — not by
asking the player to press a collect button that could only ever succeed.

### 3. The batch is exactly the quality floor

`batch.quality === craft.qualityFloor`, always, with nothing above it.
`conditionPercent` is always 100, and the equipment effect is looked up from the
chosen technique. Every field of the batch is a pure function of the order plus
content.

"At least the floor" leaves the result ambiguous, and an ambiguous output has
the shape a hidden roll would take even when there is no roll behind it. The
screen promises *"Serviceable or better — guaranteed"* before the confirm and
delivers precisely what it named, so the player can predict the outcome exactly.
Variance above a floor — smith skill, mastery — is a Prompt 12 question.

**No probability vocabulary exists in the feature**, and a test asserts it
mechanically over the rendered screens: no `%`, and none of *chance*, *odds*,
*risk*, *roll*, *probability* or *likelihood*. This is what makes the eventual
Runeforging risk panel land as a change in kind.

### 4. One craft, ever, in this slice

`beginCraft` rejects whenever a craft exists in **any** state, terminal
included. A second project would overwrite the one stored batch and destroy the
provenance and destination that later systems read. Once the craft has settled,
the Forge states that the request has been answered and offers no new project.

Repeat crafting needs somewhere to keep more than one batch, which is
authoritative forging's job.

### 5. Commands name intent, and carry no numbers

```ts
beginCraft(order: CraftOrder, signal?): Promise<SettlementState>;
procureCraftShortfalls(order: CraftOrder, signal?): Promise<SettlementState>;
chooseCraftDestination(craftId: string, destination: Destination, signal?): Promise<SettlementState>;
```

**No `quantity`** — 100 is the kingdom request's, and a caller that could choose
it could choose wrong. **No `askingPriceGold`** — the listing price is content,
and pricing is a later prompt. **`craftId` on the destination command**, so a
stale screen cannot settle a batch it was not looking at; it is the nearest
thing to an idempotency key before one exists.

### 6. Every lifecycle state is a stated screen

Both commit routes are addressable, so a player can arrive at either in any
state. Each renders what is true and **no control it could not honour**: no
confirm where a craft cannot begin, and no destination options where there is no
decision to make. The route guard and the source's own state check are two
independent layers, the arrangement ADR-0017 established for duplicate
confirmation.

### 7. The Forge area appears with the building

The rail entry arrives when the Forge is `Complete` and is absent before that,
never disabled — `NAVIGATION.md` §1. The routes stay addressable regardless and
explain themselves, the way a construction site that cannot be raised does.

## Alternatives

**Two aggregates, `ForgeCraft` and `EquipmentBatch`.** Rejected for this slice:
the glossary's distinction survives because `batch` is its own typed object with
its own identity and provenance, and splitting the record in a mock buys a join
nothing performs. Prompt 12 splits the row, not the vocabulary.

**Four terminal statuses instead of `Settled` + destination.** Rejected: it
collapses two facts into one field, and every later reader asking *where did it
go* would have to reinterpret a state machine.

**An explicit `completeCraft` command.** Rejected: it can only ever succeed, it
would be blocked offline for no reason, and it puts a button in front of the
player that is not a decision — which is precisely the "only a timer" failure
the acceptance criterion warns about.

**Crediting Gold when a batch is listed.** Rejected: there is no buyer, and the
glossary's *bounded demand — there is no infinite vendor* rules it out. The
listing records its asking price and pays nothing.

**Letting the deadline expire.** Rejected: `COMPONENTS-AND-STATES.md` §5 forbids
copy implying urgency the game does not have, and real deadline pressure is
economy work this slice excludes. The three days are stated as context; nothing
reads them.

**Allowing a second craft after the first settles.** Rejected: it would
overwrite the stored batch. See §4.

## Consequences

- **`Sound` is not a quality tier.** `rune_list.md` names Sound as a rune —
  *vibration and silence* — so the placeholder ladder is `Serviceable` | `Fine`.
  Reusing the word would have collided with rune vocabulary the moment runes
  arrived. Recorded in [`GLOSSARY.md`](../domain/GLOSSARY.md) §3.
- **`CommitPhase` grew a subject.** It carried a `BuildingKind`; construction is
  no longer the only thing that commits, so it now carries a discriminated
  `CommitSubject`. A craft rejection cannot disable a construction control
  elsewhere on the page.
- **The shortfall maths moved to `api/procurement.ts`** and is shared by
  construction and forging. A shortage of 20 Timber means the same thing and
  costs the same wherever the player meets it, and the duplicated placeholder
  rate is gone.
- **The unavailable-specialist case needed its own scenario.** A smith busy at
  the anvil only proves that a second craft is refused, which is a different
  rule, so `smithUnavailable` primes him away before anything is forged. It is
  reachable at `?scenario=smith-away`.
- **No backend change, and no migration.** The craft lives in the fake source,
  as Prompt 5 and the construction half did.
- **Forging telemetry is not here.** It is deferred to the playtest package that
  defines what the numbers are for.

## What later work reads

| Need | Field |
|---|---|
| Is there a batch, and is it free to equip? | `craft.status === 'Settled' && craft.destination === 'Equipped'` |
| Equipment summary | `batch.quantity`, `batch.quality`, `batch.conditionPercent` |
| The lever that changes readiness | `batch.equipmentEffectTier`, bounded 1–2, and `craft.destination` — a batch sold, contracted or retained is not available to the company |
| Maker history | `batch.maker` — smith, mastery, settlement, pattern, grade, technique, content and rules versions |
