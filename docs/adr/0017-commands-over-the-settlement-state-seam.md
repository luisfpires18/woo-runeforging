# ADR-0017 — Commands over the settlement state seam

**Status:** Accepted
**Date:** 4 August 2026

## Context

Prompt 5 built a read-only seam: `SettlementStateSource` had one method,
`load`, and components consumed the returned `SettlementState` through a
provider without knowing whether it came from a fixture or a server
([ADR-0015](0015-frontend-routing-and-tests.md)). An ESLint rule keeps
`features/` and `components/` from reaching a fixture directly.

Prompt 6 needs the player to **change** something: confirm a construction,
spend the cost, and resolve a shortage. That is the first write in the client's
history, and how it is shaped now is what Prompts 10–17 will inherit when the
fake source is replaced by an HTTP one.

## Decision

**Commands live on the source, beside `load`, and each returns the whole
resulting state.**

```ts
interface SettlementStateSource {
  load(signal?: AbortSignal): Promise<SettlementState>;
  beginConstruction(kind: BuildingKind, signal?): Promise<SettlementState>;
  procureConstructionShortfalls(kind: BuildingKind, signal?): Promise<SettlementState>;
}
```

**No optimistic updates, and no client-side mutation of `SettlementState`.**
A command's return value replaces the state wholesale. That is exactly the shape
a `POST` followed by a re-read will take, so the HTTP implementation is a
different class and not a different architecture.

**The source is authoritative, and re-checks everything at command time.** The
quote a screen displays is for reading; `beginConstruction` verifies status and
affordability again before it spends, because between render and click the state
may have moved.

**Commands name intent, never amounts.** `procureConstructionShortfalls` takes a
building, not a resource and a quantity: the source computes which resources are
short, what they cost and what is left. A caller that could choose the quantity
could choose a wrong one.

**Duplicate calls are rejected, never silently ignored.** The provider exposes a
`commit` phase; the control is disabled while a command is in flight; and if a
call arrives anyway it reaches the source, which refuses it because the building
is no longer `NotBuilt`. Two layers, because a UI guard alone is a race and
`Idempotency key` is deferred to Prompt 9.

## Alternatives

**A separate command bus or mutation hook.** Rejected: a second abstraction over
one source with two methods, and it would have needed its own story about how
commands and reads stay consistent. Returning the new state answers that by
construction.

**Optimistic updates with rollback.** Rejected for this slice. It requires the
client to reimplement the spend rule to predict the outcome — the exact
duplication the seam exists to prevent — and buys responsiveness the mock does
not need.

**Commands that return void, followed by `reload()`.** Rejected: two round trips
where one will do, and a window in which the screen has committed but does not
yet know what it committed to.

**Passing amounts to procurement.** Rejected: see above. It also invites a
caller to buy more than the shortfall, which is a pricing decision Prompt 10
owns.

## Consequences

- **`quoteFor(state, kind)` is a pure function in `api/construction.ts`**, not a
  source method. It derives cost, the resulting balances, shortfalls and the
  Gold price from a `SettlementState` a component already holds, so the confirm
  screen needs no extra round trip and no fixture import. The ESLint fence is
  unaffected.
- **The fake source becomes stateful.** It was a pure function of scenario plus
  clock; it now holds balances and construction records that commands mutate,
  and resolves elapsed time on read. The three scenarios and the deterministic
  `FakeClock` are unchanged.
- **A failed command is a visible rejection**, not a silent no-op — carried in
  the provider's `commit` phase and announced assertively.
- **The HTTP source will need an idempotency story** when Prompt 9 adds one.
  Until then the state-machine check in the source is the whole guard, and it is
  enough because the source is in-process.
