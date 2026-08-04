# Wireframes

**Status:** Proposed — awaiting design approval

Low fidelity on purpose. These fix **layout, hierarchy and copy** — not pixels.
Prompt 5 owns the visual execution using `VISUAL-LANGUAGE.md`.

> **Amended by Prompt 5 (3 August 2026): the site holds seven buildings, not
> five.** Prompt 5 asks the player to "build or preview the House Hall,
> storehouse, barracks, and forge", and Prompt 11 lists Barracks and Forge as
> Foundations of Iron buildings. They are shown as **previews** — visible on the
> site with the reason they cannot be raised — beside the five raisable ones.
> The drawings below show five plots; read them as seven.

**Reading key**

```
[ Filled Button ]     primary action        ( Outline Button )   secondary
< Text link >         tertiary              ▸ / ▾                collapsed / expanded
■ complete            ▨ under construction  □ not built
⚠ attention           ✓ success             ⌛ waiting
```

Numbers shown are the starter content in `Content/BuildingCatalogue.cs` and
`StarterContent.cs`. They are **placeholders for balance**, not decisions.

---

## 1. House Seat — first session, desktop

The screen that has one job: make the first move unmissable.

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ⌂  House Karrow · Ashen Reach                              [ Outpost ]   │
│  Gold 250   Provisions 200   Timber 220   Stone 180   Ore 120   Supp 100  │
├──────────────┬────────────────────────────────────────────────────────────┤
│              │                                                            │
│ ▸ Seat       │   Ashen Reach                                              │
│   Settlement │   A claimed site on the ridge road. Nothing built yet.     │
│              │                                                            │
│              │   ┌──────────────────────────────────────────────────┐     │
│              │   │  Your first task                                 │     │
│              │   │                                                  │     │
│              │   │  The site has timber within reach. A lumber yard │     │
│              │   │  will keep every other project supplied.         │     │
│              │   │                                                  │     │
│              │   │  Lumber Yard · 40 Timber, 30 Supplies · 15 min   │     │
│              │   │                                                  │     │
│              │   │  [ Raise the Lumber Yard ]   < see all options > │     │
│              │   └──────────────────────────────────────────────────┘     │
│              │                                                            │
│              │   THE SITE                                                 │
│              │   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│              │   │   □    │ │   □    │ │   □    │ │   □    │ │   □    │   │
│              │   │ House  │ │ Store- │ │ Lumber │ │ Quarry │ │  Mine  │   │
│              │   │  Hall  │ │ house  │ │  Yard  │ │        │ │        │   │
│              │   └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
│              │                                                            │
│              │   "The old road cuts through stone the masons say was      │
│              │    marked before Arkazia had a name."                      │
│              │                                          — rune foreshadow │
└──────────────┴────────────────────────────────────────────────────────────┘
```

**Why this shape**

- The task card is the **only** filled button on the screen. Everything else is
  outline or link.
- It states cost, duration and reasoning **before** the player commits — the
  "prepare" step of the loop.
- `< see all options >` is deliberately quiet but present. The recommendation is
  not a rail.
- Five plots visible from the first second: growth has somewhere to happen.
- The foreshadow line is **static prose**. No control, no affordance.

---

## 2. House Seat — returning session, desktop

Same screen, different job: answer the three questions before they are asked.

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ⌂  House Karrow · Ashen Reach                              [ Outpost ]   │
│  Gold 250   Provisions 200   Timber 180   Stone 180   Ore 120   Supp 70   │
├──────────────┬────────────────────────────────────────────────────────────┤
│              │                                                            │
│ ▸ Seat       │   WHAT CHANGED            │  NEEDS ATTENTION               │
│   Settlement │   ─────────────           │  ────────────────              │
│              │   ✓ Lumber Yard complete  │  ⚠ Storehouse due in 4 min     │
│              │     2 hours ago           │    < go to construction >      │
│              │                           │                                │
│              │   ✓ Storehouse begun      │  ⚠ Not enough Timber for the   │
│              │     2 hours ago           │    House Hall — short by 20    │
│              │                           │    < see the site >            │
│              │   < full history >        │                                │
│              │                                                            │
│              │   ┌──────────────────────────────────────────────────┐     │
│              │   │  Next  ·  Raise the Quarry                       │     │
│              │   │  60 Timber, 30 Supplies · 20 min                 │     │
│              │   │  [ Raise the Quarry ]        < see all options > │     │
│              │   └──────────────────────────────────────────────────┘     │
│              │                                                            │
│              │   THE SITE                                                 │
│              │   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│              │   │   □    │ │   ▨    │ │   ■    │ │   □    │ │   □    │   │
│              │   │ House  │ │ Store- │ │ Lumber │ │ Quarry │ │  Mine  │   │
│              │   │  Hall  │ │ house  │ │  Yard  │ │        │ │        │   │
│              │   │        │ │  4 min │ │        │ │        │ │        │   │
│              │   └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
└──────────────┴────────────────────────────────────────────────────────────┘
```

**Differences from the first session**

- *What changed* and *Needs attention* take the top; the action card drops below
  them. A returning player reads before acting.
- Every attention item is a **link straight to where it is resolved** — the
  two-minute session never navigates a hierarchy.
- A shortage is stated as an amount (*short by 20*), not as a disabled button.
- The site row shows a real difference from last visit: one ■, one ▨.
- **The primary action may differ or be absent** — see `COMPONENTS-AND-STATES.md`
  §4.

---

## 3. House Seat — mobile

First session, `< 48rem`. Returning session stacks in the order of §2.

```
┌──────────────────────────┐
│ ⌂ HOUSE KARROW           │
│   Ashen Reach  [Outpost] │
│ GOLD PROV TIMBER         │
│  250  200    220         │
│ STONE ORE WORKSHOP       │
│  180  120 SUPPLIES 100   │
├──────────────────────────┤
│ THE HOUSE SEAT           │
│ Ashen Reach              │
│ A claimed site on the    │
│ ridge road.              │
│ ┌──────────────────────┐ │
│ │▓▓▓ scene banner ▓▓▓▓ │ │  the world, compressed
│ ├──────────────────────┤ │
│ │ YOUR FIRST TASK      │ │  the ledge, straight after
│ │ Lumber Yard          │ │
│ │ The site has timber… │ │
│ │ 40 Timber · 30 Sup…  │ │
│ │ [ Raise the        ] │ │
│ │ [ Lumber Yard      ] │ │
│ │ < see all options >  │ │
│ ├──────────────────────┤ │
│ │ THE SITE             │ │
│ │ ┌───────┐ ┌───────┐  │ │  the sites, two across
│ │ │ ▒art▒ │ │ ▒art▒ │  │ │
│ │ │ House │ │ Store │  │ │
│ │ │  □ … │ │  □ …  │  │ │
│ │ └───────┘ └───────┘  │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│   SEAT   │  SETTLEMENT   │
└──────────────────────────┘
```

- **Scene, decision, detail — in that order.** The ledge is ordered between the
  scene banner and the site plots, so the thing worth doing is never below seven
  plots. The three are siblings in one flex column purely so this reorder is
  possible with CSS alone.
- Cost stays on one wrapped line here; the settlement ledge breaks it out.
- The primary button is **full width** and stacks above the secondary link, so
  neither is pushed off the edge.
- **The site plots wrap into two columns. Nothing scrolls horizontally** —
  amended from the original "the row scrolls horizontally", because seven plots
  do not fit across a 1280px viewport either, and a clipped final plot reads as
  broken rather than as scrollable.
- Everything the desktop offers is here. Nothing is dropped.

---

## 4. Settlement — desktop

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ⌂  House Karrow · Ashen Reach                              [ Outpost ]   │
│  Gold 250   Provisions 200   Timber 180   Stone 180   Ore 120   Supp 70   │
├──────────────┬────────────────────────────────────────────────────────────┤
│   Seat       │  Ashen Reach — Outpost                                     │
│ ▸ Settlement │  Mountain road, alpine forest below the ridgeline.         │
│              │                                                            │
│              │  ┌─────────────────────────────────────────────────────┐   │
│              │  │                                                     │   │
│              │  │        [ settlement illustration — later ]          │   │
│              │  │     three-quarter view, buildings by state          │   │
│              │  │                                                     │   │
│              │  └─────────────────────────────────────────────────────┘   │
│              │                                                            │
│              │  BUILDINGS                                                 │
│              │  ┌────────────────────────────────────────────────────┐    │
│              │  │ ■ Lumber Yard          Complete                    │    │
│              │  │   Timber processing                                │    │
│              │  ├────────────────────────────────────────────────────┤    │
│              │  │ ▨ Storehouse           ▓▓▓▓▓▓▓▓░░  4 min left      │    │
│              │  │   Covered storage                 ( View )         │    │
│              │  ├────────────────────────────────────────────────────┤    │
│              │  │ □ House Hall           120 Timber · 80 Stone       │    │
│              │  │   Seat of the House    40 Supplies · 30 min        │    │
│              │  │                        ⚠ short 20 Timber           │    │
│              │  ├────────────────────────────────────────────────────┤    │
│              │  │ □ Quarry               60 Timber · 30 Supplies     │    │
│              │  │   Cut stone            20 min      [ Raise ]       │    │
│              │  ├────────────────────────────────────────────────────┤    │
│              │  │ □ Mine                 80 Timber · 40 Stone        │    │
│              │  │   Iron-rich slopes     40 Supplies · 25 min        │    │
│              │  │                                    [ Raise ]       │    │
│              │  └────────────────────────────────────────────────────┘    │
└──────────────┴────────────────────────────────────────────────────────────┘
```

- **One row per building, always all five.** The player sees the whole site and
  what it will become — growth needs somewhere visible to go.
- Sort order is fixed — complete, in progress, available, unaffordable. It does
  not reorder under the cursor.
- An unaffordable building shows **what it is short of**, and has no button. It
  is not greyed with a dead control.
- Mobile: identical rows, single column, illustration first, `[ Raise ]`
  full-width per row.

---

## 5. Construction — desktop

The confirm step. Everything the player needs to decide, before they commit.

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Settlement › Quarry                                                      │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   Raise the Quarry                                                        │
│   Cut stone from the mountainside. Arkazia builds in stone.               │
│                                                                           │
│   COST                          AFTER                                     │
│   ─────                         ─────                                     │
│   Timber      60                Timber      180 → 120                     │
│   Supplies    30                Supplies     70 →  40                     │
│                                                                           │
│   DURATION                                                                │
│   20 minutes · complete at 14:35                                          │
│                                                                           │
│   ┌───────────────────────────────────────────────────────────────┐       │
│   │  Once begun, this cannot be cancelled.                        │       │
│   └───────────────────────────────────────────────────────────────┘       │
│                                                                           │
│   [ Begin construction ]      ( Cancel )                                  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

- **The "after" column is the point.** A cost alone does not tell the player
  whether they can still afford the next thing.
- The completion **time** is shown, not only the duration.
- The non-cancellable boundary is stated **before** confirming, not discovered
  after. This is the interface half of the domain rule.
- Mobile: same content, cost and after stacked, buttons full-width and stacked
  with the primary on top.

**While it runs** — no separate screen. The building row shows a progress bar,
and the House Seat lists it under *Needs attention* when it is nearly due.

---

## 6. Forge — desktop

**Not built by Prompt 3.** Mocked at Prompt 6. Drawn so the design exists first.

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ⌂  House Karrow · Ashen Reach                              [ Outpost ]   │
│  Gold 250   Provisions 200   Timber 120   Stone 180   Ore 120   Supp 40   │
├──────────────┬────────────────────────────────────────────────────────────┤
│   Seat       │  The Forge                                                 │
│   Settlement │  Smith on duty: <named smith>, Weaponsmith                 │
│ ▸ Forge      │                                                            │
│              │  ┌──────────────────────────────────────────────────┐      │
│              │  │  KINGDOM REQUEST                                 │      │
│              │  │  100 infantry swords for the Red Bastion         │      │
│              │  │  Pays 400 Gold · due in 3 days                   │      │
│              │  └──────────────────────────────────────────────────┘      │
│              │                                                            │
│              │  NEW PROJECT                                               │
│              │  Pattern     [ Arkazian infantry sword    ▾ ]              │
│              │  Grade       ( Iron )  ( Steel — needs a furnace )         │
│              │  Technique   [ Standard pattern           ▾ ]              │
│              │  Smith       [ <named smith>              ▾ ]              │
│              │  Quantity    [ 100 ]                                       │
│              │                                                            │
│              │  ┌──────────────────────────────────────────────────┐      │
│              │  │  Cost      80 Ore · 20 Timber · 40 Supplies      │      │
│              │  │  Duration  45 min                                │      │
│              │  │  Quality   Serviceable or better — guaranteed    │      │
│              │  └──────────────────────────────────────────────────┘      │
│              │                                                            │
│              │  [ Begin the craft ]      ( Cancel )                       │
└──────────────┴────────────────────────────────────────────────────────────┘
```

- **"Guaranteed" is stated outright.** Ordinary forging has a quality floor and
  no hidden roll — Workbase §8. The word does real work: it is what makes the
  eventual Runeforging risk panel land as a change in kind.
- **No probability vocabulary anywhere on this screen.** No percentage, no odds,
  no "chance". That language belongs to Runeforging alone.
- Steel is visible but unavailable, with the reason. A material grade the player
  can work toward is different from a locked system they cannot.
- The destination choice comes **after** completion, on its own — one batch, one
  exclusive destination.

---

## 7. Army — desktop

**Not built by Prompt 3.** Mocked at Prompt 7.

```
┌───────────────────────────────────────────────────────────────────────────┐
│   Seat       │  Companies                                                 │
│   Settlement │                                                            │
│   Forge      │  ┌──────────────────────────────────────────────────┐      │
│ ▸ Army       │  │  ⚔ First Bastion                    Ready        │      │
│              │  │  Arkazian line infantry · 100 soldiers           │      │
│              │  │                                                  │      │
│              │  │  Main hand   ■ 100 iron swords · serviceable     │      │
│              │  │  Off hand    □ no shields assigned               │      │
│              │  │                                                  │      │
│              │  │  Morale  ▓▓▓▓▓▓▓▓░░    Training ▓▓▓▓▓▓░░░░       │      │
│              │  │                                                  │      │
│              │  │  ( Equipment )   ( Formation )                   │      │
│              │  └──────────────────────────────────────────────────┘      │
│              │                                                            │
│              │  Readiness: equipped, untested.                            │
└──────────────┴────────────────────────────────────────────────────────────┘
```

- **Two equipment slots, always both shown.** Canon: every wield is two slots,
  one hand each; the Bastion is Sword + Shield. An unfilled slot is visible, not
  hidden — it is a decision waiting.
- **Readiness is one plain sentence**, not a computed score. A number invites
  optimisation before the player understands what it means.
- Batch, not soldiers: "100 iron swords", one row.

---

## 8. Battle report — desktop

**Not built by Prompt 3.** Mocked at Prompt 7.

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Reports › The ridge road                                                 │
├───────────────────────────────────────────────────────────────────────────┤
│   The ridge road                                    Held · 2 hours ago    │
│                                                                           │
│   ┌─────────────────────────────────────────────────────────────┐         │
│   │            [ replay — later, PixiJS ]                       │         │
│   │      ▶  ⏸   ──────●────────────  1×   ⚙                    │         │
│   │      < read the written report instead >                    │         │
│   └─────────────────────────────────────────────────────────────┘         │
│                                                                           │
│   WHAT DECIDED IT                                                         │
│   • Your swords held the line where the shield wall met theirs.           │
│   • Your companies were unshielded — losses were heavier than needed.     │
│                                                                           │
│   YOUR LOSSES                    EQUIPMENT                                │
│   ─────────────                  ─────────                                │
│   Killed          12             Serviceable      71                      │
│   Wounded         23             Damaged          18                      │
│   Returned        65             Lost             11                      │
│                                                                           │
│   [ Repair 18 swords · 30 Ore ]     ( Do nothing for now )                │
└───────────────────────────────────────────────────────────────────────────┘
```

- **"What decided it" comes before the numbers.** The acceptance criterion for
  the whole slice is that a player can explain how their equipment changed the
  battle — prose does that, a casualty table does not.
- The report is **complete without the replay**. The replay is an enrichment and
  always has a text alternative — required for reduced motion, for a failed
  renderer, and for a missing asset.
- It ends in a **decision**, not an acknowledgement: consequence feeds the next
  loop.
- Losses reconcile: 12 + 23 + 65 = 100. Equipment: 71 + 18 + 11 = 100.

---

## 9. What these wireframes commit to

| Commitment | Where it shows |
|---|---|
| Cost, duration and consequence are visible **before** confirming | §5, §6 |
| Growth is legible at a glance | §1 → §2 site row; §4 building list |
| Forging is a decision, not a timer | §6 — pattern, grade, technique, smith |
| Consequence returns to the loop | §8 ends in a repair choice |
| Mobile keeps every decision | §3, and the rule in `NAVIGATION.md` §3 |
| Runes are foreshadowed, never exposed | §1 — one line of prose, no control |
