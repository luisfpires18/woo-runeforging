# Information architecture and navigation

**Status:** Proposed — awaiting design approval

---

## 1. The shape

**The Outpost is home.** Not the map, not the War Council. The player develops
one settlement, and the home screen is that settlement's report — Workbase §5.

```mermaid
flowchart TD
    HS["<b>Outpost</b><br/><i>home · what changed · what needs attention</i>"]

    ST["Settlement<br/><i>the site and its buildings</i>"]
    FO["Forge<br/><i>craft projects</i>"]
    AR["Army<br/><i>companies and equipment</i>"]
    RE["Reports<br/><i>battles and history</i>"]

    CO["Construction<br/><i>cost, duration, confirm</i>"]
    CR["Craft<br/><i>pattern, smith, confirm</i>"]
    BR["Battle report<br/><i>what happened and why</i>"]

    HS --> ST
    HS --> FO
    HS --> AR
    HS --> RE
    ST --> CO
    FO --> CR
    RE --> BR

    HS -.->|"direct from an attention item"| CO
    HS -.->|"direct from an attention item"| BR
```

**Four destinations, three detail views.** Construction, Craft and Battle report
are reached from their parent — and also **directly from a Outpost attention
item**, because the two-minute session must not require navigating a hierarchy
to act on the thing the screen just told the player about.

### What exists when

| Area | Prompt | Until then |
|---|---|---|
| Outpost, Settlement, Construction | 5–6 | — |
| Forge, Craft | 6 | Not present. **Not shown as locked** |
| Army | 7 | Not present |
| Reports, Battle report | 7 | Not present |

**Absent, not disabled.** A greyed-out tab teases a system the player cannot
reach and cannot work toward. Navigation shows what exists; it grows as the game
does.

---

## 2. Desktop

`≥ 48rem`. Content column maxes at `content-max` (90rem) and centres.

```
┌──────────────────────────────────────────────────────────────┐
│ ⌂ HOUSE KARROW          GOLD  PROV  TIMBER  STONE  ORE  SUPP │  one HUD band,
│   Arkazian Outpost [Outpost]  250   200     220    180  120   100 │  stone
├──────────┬───────────────────────────────────────────────────┤
│▌ SEAT    │            screen content                         │  surface-0
│  SETTLE… │                                                   │
│  rail,   │                                                   │
│  welded  │                                                   │
│  to HUD  │                                                   │
└──────────┴───────────────────────────────────────────────────┘
   rail                      max 90rem, centred
```

- **One HUD band.** Settlement identity, settlement state and the stores answer a
  single question — what do I hold, and where — so they share one stone band
  rather than stacking into two. The band keeps a fixed minimum height, so it
  does not change size between the loading state and the loaded one.
- **A rail welded to it.** Shared edge, no gap. Current area marked by a cloth
  fill **and** a forge-light rule **and** `aria-current="page"` — never colour
  alone.
- **The resource bar is always visible.** Every commitment spends resources; the
  player must never navigate away to check whether they can afford something.
- **The HUD names the settlement.** Identity, on every screen.

---

## 3. Mobile

`< 48rem`. Single column, bottom tab bar.

```
┌────────────────────────┐
│ ⌂ HOUSE KARROW         │  HUD, compact
│   Arkazian Outpost [Outpost]│
│ GOLD  PROV   TIMBER    │  stores, 3 across,
│  250   200      220    │  labels kept
│ STONE ORE  WORKSHOP    │
│  180  120  SUPPLIES 100│
├────────────────────────┤
│                        │
│    screen content      │  single column
│                        │
├────────────────────────┤
│   SEAT    │ SETTLEMENT │  bottom tabs, 44px min
└────────────────────────┘
```

- **Bottom tab bar**, thumb-reachable, `44 × 44px` minimum per target, always
  labelled — never icon alone.
- **The resource bar keeps its labels**, wrapping to two rows of three. It never
  disappears. *(Amended by Prompt 5: the original "collapses to values, expanding
  on tap" was implemented literally with `display: none` and removed the names
  from the accessibility tree as well as the screen, leaving a row of bare
  numbers with nothing to say what they counted.)*
- Tabs appear only for areas that exist; with two areas there are two tabs.

### The mobile rule

> **Any control that commits resources, confirms a craft or chooses a
> destination must be reachable in at most two taps from its screen, with no
> nested modal.**

This is the testable form of "mobile preserves all essential decisions". A
confirmation may be a sheet, but a sheet may not open another sheet. If a flow
cannot meet this, the flow is wrong, not the rule.

**No decision is desktop-only.** Wider viewports may show more at once —
side-by-side comparison, a longer history — but never a choice the phone cannot
make.

---

## 4. Navigation rules

- **Every screen is addressable by URL.** Back and forward behave. Refresh
  returns to the same place.
- **Back never loses committed work.** Commitment happens at confirm; leaving a
  form before then discards nothing that was spent.
- **Breadcrumbs on detail views only** — `Settlement › Storehouse`. Top-level
  areas need none.
- **One level of nesting.** Area → detail. Anything demanding a third level is a
  sign the model is wrong, and gets raised rather than absorbed.
- **Attention items are links.** Every item in "needs attention" navigates
  straight to where it is resolved.

---

## 5. Layout of the Outpost

The home screen's regions, in priority order. This ordering is the same on both
viewports — mobile stacks it, desktop may place *What changed* and *Needs
attention* side by side.

| Region | Answers | Priority |
|---|---|---|
| Identity — settlement, kingdom, stage | Who am I | Always visible |
| Resources | What do I hold | Always visible |
| **Primary action** | What should I do now | First session: exactly one. Otherwise: see below |
| What changed | What completed while I was away | Above the fold |
| Needs attention | What is due, blocked or short | Above the fold |
| Settlement summary | What does my site look like | Below the fold |

**On the primary action.** Exactly one filled button is a **first-session**
device — the whole job of that screen is making the first move unmissable.

It does not generalise:

- a **returning** session may lead with a different action — collect a completed
  building, respond to what changed;
- some states have **none**, and must not manufacture one. An error offers a
  retry, not a next move. A state where everything is under way and nothing is
  affordable should say so plainly rather than fill the slot.

`COMPONENTS-AND-STATES.md` §4 records which states carry a primary action and
which deliberately do not.
