# Components and states

**Status:** Proposed — awaiting design approval

The inventory Prompt 5 builds from, and the six states every screen must handle.

---

## 1. Component inventory

Small on purpose. A component earns its place by appearing on **at least two
screens** or by carrying a rule that must not be reimplemented twice.

### Layout

| Component | Purpose | Notes |
|---|---|---|
| `AppShell` | HUD, navigation, content region | One stone band; rail ↔ bottom tabs at `48rem` |
| `ResourceBar` | The six balances, always visible | **Keeps its labels on mobile**, wrapping to two rows of three |
| `SettlementScene` | The outpost, and where each site stands in it | One panorama plus a `BuildingKind → anchor` map. Used by both screens |
| `BuildingRow` | One site plot standing in the scene | Illustrated plate, nameplate, state. Selecting one is local and visual |
| `Breadcrumb` | Detail-view ancestry | Detail views only |

**`Panel` and `Card` were removed by the second visual pass.** A single container
style applied to everything is what made the screen read as a dashboard: the
world, the decision and the record all arrived in the same rectangle. There are
now three levels, and each has its own language —

| Level | What it is | Language |
|---|---|---|
| World | The settlement scene | Full-bleed artwork inside a steel frame. No inner boxes |
| Command | Site plots, and the ledge welded under the scene | Stone plates, lit steel rims, an inset ledger for terms |
| Record | Residents, what changed, needs attention, lore | Open composition. A small wide label over a hairline rule, then rows. No border, no fill |

A thing at one level is never dressed like a thing at another. That rule is what
the removed components were getting in the way of.

### Content

| Component | Purpose | Notes |
|---|---|---|
| `ResourceAmount` | One quantity with its icon | **Monospace, tabular figures.** Never re-renders width while counting |
| `CostList` | A `ResourceCost` | Stacks one per line on mobile |
| `CostAfterTable` | Cost beside resulting balance | The construction and craft confirm step |
| `ProgressBar` | Elapsed-time progress | Derived from timestamps, never from a client tick |
| `TimeRemaining` | "4 min left", "complete at 14:35" | Both forms; absolute time for anything over an hour |
| `StatusChip` | ■ complete / ▨ building / □ not built | **Glyph plus text.** Never colour alone. On a site plot the frame language carries it too — see `VISUAL-LANGUAGE.md` §8.3 |
| `AttentionItem` | One row of "needs attention" | **Always a link** to where it is resolved |
| `ChangeItem` | One row of "what changed" | Relative time; aggregates when a long absence produces many |
| `EmptySlot` | An unfilled equipment slot | Visible, not hidden — a decision waiting |

### Action

| Component | Purpose | Notes |
|---|---|---|
| `PrimaryAction` | The filled button | **At most one per screen.** See §4 |
| `SecondaryAction` | Outline button | Any number |
| `TertiaryAction` | Text link | Quiet alternatives |
| `ConfirmPanel` | Cost, consequence, irreversibility, confirm | Used by construction and craft |
| `ShortfallNotice` | "short 20 Timber" | **Replaces** a disabled button — never both |

### Feedback

| Component | Purpose | Notes |
|---|---|---|
| `StateRegion` | Renders the six states of §2 | Every data region uses it |
| `Toast` | Transient confirmation | Never the only record of something that happened |
| `InlineError` | Field-level problem | Beside the field, not at the top of the form |

**Not in the inventory, deliberately:** modal dialog stacks, carousels, tooltips
as the only source of information, infinite scroll, skeleton screens that shift
layout, any control whose meaning rests on colour alone.

---

## 2. The six states

Every region that loads or acts handles all six. Defined once here; §3 says what
each screen shows.

### Loading

> A settled placeholder at the region's real height, with `aria-busy="true"`.

**Nothing jumps when data arrives.** The placeholder reserves the final layout.
No spinner for anything under 300ms — a flash of spinner is worse than a beat of
stillness.

### Empty

> The region has no content **and that is correct**.

Says what will fill it and how. *"No completed projects yet. Raising a building
will fill this."* Empty is not an error and never uses `danger`.

**Empty is the first session's normal condition.** It carries the most weight on
the screen a new player sees first.

### Error

> Something failed. It is not the player's fault, and it may be recoverable.

States what failed in plain words, offers **retry**, and preserves anything the
player had entered. *"Could not reach the settlement. Your work is not lost."*

**No stack traces, no codes, no blame.** An error offers a retry, **not a next
move** — see §4.

### Unavailable

> The system exists but cannot be used **right now**, for a reason the player can
> act on.

Names the reason and the remedy. *"The Quarry needs 20 more Timber."*

**Distinct from "not built yet".** A system that does not exist is absent from
navigation entirely — it does not get an unavailable state, because that would
advertise it.

### Success

> A commitment took effect.

Confirmed **in place, by the thing changing** — the building row becomes ▨, the
resource bar drops. A toast may accompany it but is never the only evidence:
a player who blinked must still be able to see what happened.

Success is not a modal. It does not interrupt.

### Offline

> The client cannot reach the server.

A persistent, non-blocking banner. **The last-loaded state stays readable** —
resources, buildings and progress are still worth seeing. Actions that would
commit are disabled with the reason, and the banner clears itself on reconnect.

**Never a blocking overlay.** The player who opened the app on a train to check
whether their storehouse is done should get that answer.

---

## 3. Screen × state

What each screen shows. Only the structurally distinct cases are drawn in
`WIREFRAMES.md`; the rest follow these rules.

| Screen | Loading | Empty | Error | Unavailable | Success | Offline |
|---|---|---|---|---|---|---|
| **Outpost** | Placeholder per region | First session — the task card **is** the empty state | Retry; identity and resources stay | — | Site row updates in place | Banner; report readable, actions disabled |
| **Settlement** | Building list placeholder | Never empty — five plots always | Retry the list | Per row: shortfall notice | Row becomes ▨ | Banner; list readable |
| **Construction** | Cost placeholder | — | Retry; entered values kept | Confirm replaced by shortfall | Return to settlement, row changed | Confirm disabled with reason |
| **Forge** | Project placeholder | "No projects. Choose a pattern to begin." | Retry | Steel shown with its requirement | Project appears in progress | Confirm disabled |
| **Army** | Company placeholder | "No companies yet." | Retry | Equipment slot shows what is missing | Slot fills | Banner; readable |
| **Battle report** | Report placeholder | "No battles yet." | Retry the report | Replay unavailable → **written report** | Repair choice resolves in place | Banner; report readable, repair disabled |

**The battle report's unavailable state is the important one.** If the replay
cannot render — reduced motion, a failed asset, an unsupported log version — the
written report is not a degraded fallback. It is the report; the replay is the
enrichment.

---

## 4. Where a primary action belongs

Exactly one filled button is a **first-session onboarding device**, not a global
law. Making every state manufacture one produces buttons that exist to fill a
slot.

| State | Primary action |
|---|---|
| Outpost — **first session** | **Exactly one.** The whole job is making the first move unmissable |
| Outpost — returning, work available | **One**, and it may differ — collect a completion, resolve an attention item |
| Outpost — returning, everything under way and nothing affordable | **None.** Say so: *"Everything you can start is under way."* |
| Confirm screens | One — `Begin construction`, `Begin the craft` |
| Error | **None.** A retry, not a next move |
| Offline | **None.** Committing is what is unavailable |
| Empty | One **only if** acting is genuinely the next step |
| Loading | **None.** Nothing is known yet |

> A screen with no primary action is a valid screen. Inventing one to fill the
> slot teaches the player to distrust the slot.

---

## 5. Copy rules

- **Second person, plain, unhurried.** "Your swords held the line."
- **Say the number.** "Short 20 Timber", not "insufficient resources".
- **Name the thing.** "Raise the Quarry", not "Build".
- **No exclamation marks. No urgency the game does not actually have** — nothing
  in Foundations of Iron expires while the player sleeps, and the copy must not
  imply it does.
- **No jargon from the codebase.** No "aggregate", no "entity", no "batch ID".
- **Failure states keep their dignity.** A lost battle is reported, not scolded.
