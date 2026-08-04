# Implementation status

**Last updated:** 4 August 2026
**Current stage:** Prompt 6B — **the forging half, delivered**
**Next:** Prompt 7 — recruitment, equipment, the local battle and its replay

This document describes **what is true now**. The history of how it got here is
in the [change log](#9-change-log).

| Prompt | Commit | Contents |
|---|---|---|
| 1 | `db4a387`, `5142962` | Repository initialised; the first architecture package |
| 2 | `c1b3c98` | Platform bootstrap and the simplified architecture package |
| 2 | `a1067a7` | Review corrections and the 12 canon files |
| 3 | `bb1a1fa`, `97248cb` | The first domain model, starter content and migration |
| 3 | `9483047` | Review corrections — the construction ordering defect |
| 4 | `f084304` | The design package — documents only |
| 5 | `f6214a6` | The mocked outpost screen, from typed fake data |
| 5 | `3934729` | The two visual passes over that presentation |
| — | `21d6310` | The settlement terminology migration — House merged into Settlement |
| 6 | `f35f797` | The construction half — the commit flow |
| 6B | `f8ad7d7` | The forging half — the ordinary forging loop and the exclusive destination |

**Correcting three documents that had gone stale.** Until `f8ad7d7`,
`AGENTS.md` §8, this file's header and `SLICES.md` all described `21d6310` and
`f35f797` as uncommitted work sitting on top of Prompt 5. Both were committed and
pushed on 4 August. All three are corrected here.

**CI is green on every pushed commit**, verified against the GitHub Actions API
on 3 August 2026. `3934729`, `21d6310`, `f35f797` and `f8ad7d7` were committed on
4 August and their CI results are not recorded here:

```
f6214a6  validate  completed  success   run 30835450898
97248cb  validate  completed  success
bb1a1fa  validate  completed  success
a1067a7  validate  completed  success
```

---

## 1. What exists

**One ASP.NET Core 10 application, one PostgreSQL database, one React client.**

| Area | State |
|---|---|
| Domain | `Settlements` and `Resources` feature folders — plain C#, no EF attributes, no clock reads |
| Content | `Content/` — static C# catalogues keyed by the enums |
| Persistence | The Settlement aggregate: `Settlements`, `Buildings`, `ResourceBalances`, applied by `InitialHouseAggregate` then `MergeHouseIntoSettlement` |
| API | `/health` and `/api/v1/platform/status` only. **No endpoint exposes the domain** |
| Tests | 33 backend, 89 frontend |
| CI | `validate.yml` on `master` — backend against a real PostgreSQL service container, frontend, docs |
| Canon | 12 files in [`project_sources/`](../../project_sources/), **present and read in full** |
| Design | Seven documents in [`../design/`](../design/), amended twice by Prompt 5 |
| Web | The outpost, its site, the construction commit flow and the whole ordinary forging loop over **typed fake data**. No API over the domain, nothing saved |

**Not built:** companies, armies, battles · runes in any form · markets, Orders,
Warfronts, seasons · settlement stages beyond Outpost · the other six kingdoms ·
resource accrual, storage capacity · **real** procurement and pricing ·
authentication · background jobs, outbox, idempotency keys · object storage ·
PixiJS · Azure, deployment, Kubernetes.

**Mocked only, in the client:** the forge, the smith, the craft, the equipment
batch and its destination. **Nothing about them exists in `src/` or the
database** — the authoritative forge is Prompt 12.

---

## 1u. Prompt 6B — the forging half

**An intermediate step that completes Prompt 6. It does not change the official
29-prompt numbering.** Prompt 6 asks for construction *and* forging; the product
owner scoped the previous pass to construction and named the forging half as
deferred rather than half-building it (§1v.3). This closes it.

Prompt 7 could not start without it: it assigns "the forged 100-sword batch" to a
company, and requires that the destination change battle readiness and that maker
provenance reach the battle history. Neither a batch nor a destination existed.

### 1u.1 What was delivered

The loop the forge exists for: **read the request → choose → see the terms →
commit → the work completes → decide where it goes, once.**

- **A Forge area that arrives with its building.** `/forge` joins the rail when
  the Forge is complete, and is absent before that rather than disabled. The
  route stays addressable and states why there is no forge yet.
- **The kingdom request, with its reason.** 100 infantry swords for a Bastion
  company attached to the Red Bastion, holding the far end of the pass. Pays
  **400 Gold**; expected within three days.
- **Pattern, material grade, technique and the named smith**, at `/forge/new`.
  Steel is shown with its requirement and cannot be chosen. Three techniques,
  each shifting cost, duration, quality floor and equipment effect
  deterministically — one would have made the control decoration.
- **Everything stated before the confirm:** cost beside the balance it leaves,
  duration with the completion time, the guaranteed quality floor, what the
  swords do in the line, and **the destination decision named as still to come**,
  so it is an expected step rather than an ambush.
- **Spend and craft creation in one transition.** All-or-nothing, every check
  ahead of every balance change, exactly as construction does it.
- **Completion resolves on read**, in the same settlement pass that completes
  buildings, and records the change dated when the work actually finished.
- **One irreversible destination** at `/forge/destination` — equip your own
  company, fulfil the kingdom contract, list for sale, or retain.

### 1u.2 The model makes the rule unrepresentable

[ADR-0018](../adr/0018-forging-state-machine-and-exclusive-destination.md).
`ForgeCraft` is a **discriminated union**, not a record with flags:

```
InProgress ──(resolved on read)──► AwaitingDestination ──(chosen)──► Settled
                                                                     + Equipped
                                                                     + Contracted
                                                                     + Listed
                                                                     + Retained
```

A settled batch in two places, an unfinished craft that has already produced one,
and an equipped batch carrying an asking price are **states the type cannot
express**. "The same batch never reaches two destinations" is therefore a
property of the model rather than a rule to police, and `Settled` has no outgoing
transition to write. A `@ts-expect-error` test states the guarantee where a
reader will find it; `npm run typecheck` proves it.

**Three of Prompt 3's six rules are now met**, having had nothing to apply to:

| # | Rule | State |
|---|---|---|
| 3 | A craft cannot complete twice | **Met** — a guarded read-time transition from `InProgress` only |
| 4 | One equipment batch has one current destination | **Met** — structurally |
| 5 | A batch cannot be equipped and sold simultaneously | **Met** — structurally |

### 1u.3 Four things worth knowing

**The batch is exactly the quality floor.** Not "at least" it. An ambiguous
output has the shape a hidden roll would take even when there is none, and an
unstated upside teaches the player to expect what the screen never promised.
Variance above a floor is a Prompt 12 question.

**No probability vocabulary exists in the feature, and a test proves it** across
all three forge screens: no `%`, and none of *chance*, *odds*, *risk*, *roll*,
*probability*, *likelihood*. Batch condition is a number in the data and a word
on the screen precisely so no rate is ever printed here. This is what makes the
eventual Runeforging risk panel land as a change in kind.

**One craft, ever, in this slice.** `beginCraft` refuses whenever a craft exists
in any state, terminal included — a second would overwrite the one stored batch
and destroy the provenance and destination Prompt 7 reads. The settled Forge says
the request has been answered and offers no new project.

**The three days are context, not a timer.** Nothing reads the deadline, nothing
expires and nothing is penalised. Asserted from the two states where the passing
of time cannot be mistaken for progress — before any craft, and after the batch
has settled — because advancing three days *with a craft in flight* legitimately
completes it and would mask what is being tested.

### 1u.4 Deferred, with reasons

| Deferred | Why |
|---|---|
| **Repeat crafting** | Needs somewhere to keep more than one batch. Authoritative forging owns that; here a second craft would overwrite the first |
| **Worker and specialist assignment** | Unchanged from §1v.3. `Workforce` is a capacity, not an inventory, and no workforce model exists. Specialist *availability* — a smith saying he cannot take a job — is not the same thing and counts no labour |
| **Any limit on concurrent construction** | Unchanged from §1v.3. Still undecided anywhere in the design package |
| **Real procurement pricing, and a market** | The mock keeps the documented **1 Gold per missing unit**, and listing a batch pays nothing because there is no buyer. Bounded demand against a real economy is Prompt 10 |
| **Forging telemetry** — chosen technique, destination choice, time to first craft | Scoped out by the product owner and **retargeted to Prompt 8's playtest package**, which defines what the numbers are for. §1v.3 previously deferred it "with the forging half"; that pointer is corrected |
| **Steel, and any grade beyond Iron** | Shown with its requirement. A furnace is a building nobody has designed |

### 1u.5 What Prompt 7 reads

| Need | Field |
|---|---|
| Is there a batch, and is it free to equip? | `craft.status === 'Settled' && craft.destination === 'Equipped'` |
| Equipment summary | `batch.quantity`, `batch.quality`, `batch.conditionPercent` |
| The lever that changes readiness and outcome | `batch.equipmentEffectTier` (bounded 1–2) and `craft.destination` — a batch sold, contracted or retained is **not** available to the company, which is how the destination changes the battle |
| Maker provenance | `batch.maker` — smith, mastery, settlement, pattern, grade, technique, content and rules versions |

Only one craft is possible, so the batch is unambiguous: there is no "which one
did they mean" for Prompt 7 to resolve.

### 1u.6 Three corrections to committed work

| # | Correction |
|---|---|
| 1 | **A passing test that had become a lie.** `Construction.test.tsx` asserted that completing the Forge introduced *no* forging. That is exactly what 6B changes, so the test was rewritten around what it still guards: the settlement screen commits construction and nothing else, and the Barracks still unlocks nothing |
| 2 | **The duplicated procurement rate is gone.** `goldPerMissingUnit` sat in both `api/construction.ts` and `api/fake/content.ts`. The shortfall maths now lives once, in `api/procurement.ts`, shared by construction and forging |
| 3 | **`eslint.config.js` still said `HouseState` and `HouseStateProvider.tsx`** in the comment explaining the adapter fence — a file the ADR-0016 rename missed. Corrected |

## 1y. The visual-polish pass — committed in `3934729`

Prompt 5's presentation was functional but read as an internal dashboard. This
pass re-grounds it in Arkazia. **Information architecture, routes, scenarios,
the provider boundary, accessibility rules and mocked behaviour are unchanged**
— it is styling, artwork and layout.

### 1y.1 What changed

- **The Arkazian action** replaces the amber CTA: crimson cloth over blackened
  steel, rimmed in forge light. `#F0EAE2` on `#8E2A24` is **7.01:1**, and the
  `#E8974A` rim carries the 3:1 boundary that deep crimson alone (2.27:1)
  cannot.
- **Stone, steel and timber tokens** for panels, rails and the header band.
- **A ridge backdrop** behind the shell — decorative, `aria-hidden`.
- **The sidebar joins the shell** as a stone rail sharing an edge.
- **The resource strip is its own band**, six even cells with rules between.
- **An authored building set** on one visual grammar — shared ridge, ground
  line and palette (`web/src/assets/README.md`).
- **Building states differ structurally**, not only by colour: border style,
  opacity and a scaffold overlay, on top of the glyph and word already there.
- **Content width 72rem → 90rem**, and *what changed* / *needs attention* now
  lead the page instead of sitting in a sidebar.

### 1y.2 Two defects only visible by looking

Neither was caught by a passing build or a green test run.

**Building art silently stopped rendering.** Vite inlined the new SVGs as an
empty `data:image/svg+xml,`. The files are valid; they carry `#` in every colour
and a `url(#…)` gradient reference, which a non-base64 data URI does not survive.
`build.assetsInlineLimit: 0` — assets are emitted as real files, which also means
the fallback chain behaves as it will in production.

**Mobile clipped two things**: the "Workshop Supplies" label overflowed its cell,
and "See all options" was pushed off by the full-width button. The label wraps
now and the actions stack.

### 1y.3 Three review corrections

| # | Correction |
|---|---|
| 1 | `Settlement.test.tsx` advanced the clock **twice** — a direct `source.advance(20)` and then the button — totalling 40 minutes for a 15-minute build. The direct call is gone; **one click** now proves completion |
| 2 | The empty-state test rendered `firstSession` and asserted sections were *absent*. It now renders the **`empty` scenario** and asserts the visible residents empty state, and that it is not styled as an error |
| 3 | `AGENTS.md` and this document record Prompt 5 as committed in `f6214a6`, pushed, reviewed, CI green (run `30835450898`) |

---

## 1x. The second visual pass — committed in `3934729`

The polish pass fixed the palette but not the shape. Every piece of information
still arrived in an equally styled rectangle, the artwork was icon-scale, and
the screen read as a dashboard with a good colour scheme rather than as a
fortress strategy game.

This pass recomposes the interface around the outpost itself. **Information
architecture, routes, scenarios, the adapter seam, mocked behaviour and every
accessibility rule are unchanged**, and no Prompt 6 functionality was added.

### 1x.1 What changed

- **A settlement scene is the page.** `environment/outpost.svg` — an
  authored panorama of the pass, drawn at `1600 × 700` — fills the frame, and
  the seven sites stand on their own ground inside it at fixed anchors held in
  `components/SettlementScene.tsx`. No building is painted into the scene, so it
  stays true as the settlement changes.
- **Three visual levels, and only three:** the world, the command surface, the
  record. `.panel` is gone as a universal wrapper — a single container style
  applied to everything was the thing making the page read as software.
- **One HUD band.** Settlement identity, its state and the six balances share
  a single stone header instead of stacking two, with a fixed minimum height so
  the page does not jump between loading and loaded.
- **The rail is welded to the HUD** — shared edge, no gap, a cloth tab for the
  current area, and `aria-current="page"`, which closes a gap
  `ACCESSIBILITY.md` §4 had asked for and the first build had not delivered.
- **A command ledge replaces the objective card.** It is joined to the bottom
  edge of the world and states the one thing worth doing. The settlement screen
  uses the same ledge for whichever site is selected.
- **Site plots replace building rows** — an illustrated plate with a nameplate,
  standing where the building stands. Selecting one is **local and visual
  only**: it changes what the ledge describes. Nothing is committed, nothing is
  saved, and there is no start control.
- **Architectural vignettes replace symbolic icons.** Six drawn sites at
  `160 × 112`, each with its own ridge, terrain, foundation and working detail.
  The byte-identical ridge path shared by all seven files is gone — it made the
  set read as tiling rather than as one place seen in parts.
- **The faction placeholder was redrawn at site scale.** It is what the Forge
  actually renders, so it now depicts surveyed, pegged-out ground rather than a
  shrunken icon.
- **A display treatment on the system stack** — names heavy and tight, labels
  small and wide. Two registers, no third, and still no font file
  (`VISUAL-LANGUAGE.md` §3.1).
- **Mobile is composed rather than collapsed**: scene banner, then the ledge,
  then the sites, so the current decision is never below seven plots.

### 1x.2 Three defects only visible by looking

**`--space-5` did not exist.** Four rules in `app.css` used `var(--space-5)`
while `tokens.css` never defined it, so each declaration was invalid at
computed-value time and fell back to the initial value: panels rendered with
**zero padding**, buttons with zero side padding, and the building grid with no
gap. Nothing failed — an unresolvable `var()` is not a build error, not a lint
error and not a test failure. The token is defined now.

**The panorama shipped invisible.** An SVG comment containing `----` is a
double-hyphen, which is an XML parse error. The browser stops rendering at that
point and reports it only if you open the file directly. The rule is written
down in `web/src/assets/README.md` so it is not rediscovered.

**The settlement screen scrolled horizontally at 375px.** A two-column title row
sized the name track by content, leaving the prose a 14px track and 49px of
content. The row wraps now, and the screenshot harness asserts
`documentElement.scrollWidth` at every viewport it captures.

### 1x.3 Reversed from the polish pass

**"What changed" and "Needs attention" no longer lead the page.** They sit in
the record band below the scene. The returning player's first question is now
answered higher than before — by the site itself, where the Lumber Yard is
visibly under construction and hatched with scaffolding — and the ledge states
what is next.

### 1x.4 Reachability, for looking at states

`main.tsx` mapped only `?scenario=returning`. It now also accepts
`?scenario=empty`, so the empty state can be **looked at** and not only
asserted. This is the one place a fake source may be chosen, it changes no
component, and it adds no gameplay.

Loading and error remain unreachable from a URL by design — they were verified
by temporarily substituting a slow source and a rejecting source in `main.tsx`,
and the substitutions were reverted.

---

## 1v. Prompt 6 — the construction half, uncommitted

**Partly done.** Prompt 6 asks for the whole Foundations of Iron economy loop:
construction *and* forging. The product owner scoped this pass to the
construction half, so the forging half is deferred and named below rather than
half-built.

### 1v.1 What was delivered

The loop `review → choose → prepare → commit → resolve` closes for the first
time. Nothing spent before this; the primary action only navigated.

- **A confirm route**, `/settlement/<site>` — `WIREFRAMES.md` §5 as drawn:
  breadcrumb, cost beside the balance it leaves, duration with the completion
  time, the non-cancellable boundary stated **before** the confirm, and
  `[ Begin construction ] ( Cancel )`. A route rather than a dialog, so it has
  an address, back works and refresh returns to it.
- **Spend at confirm.** The whole cost, all-or-nothing, in the same transition
  that starts the work — what `WIREFRAMES.md` §5, `JOURNEYS.md` and ADR-0004
  had already decided. `Reservation` stays unbuilt vocabulary: with cancellation
  forbidden there is nothing to release.
- **Shortages with mocked procurement.** The shortfall **replaces** the confirm,
  names the exact amounts, the total Gold price and what is left, and buys every
  current shortfall in one all-or-nothing act. **Gold is never itself a
  shortfall** — there is no recursive way to procure it.
- **Completion resolves on read.** Anything due becomes complete on the next
  load and appends a change entry, so a settlement left alone resolves its work
  when it is next looked at rather than on a timer.
- **The Command Hall unlocks Barracks and Forge.** `previewReason` was a static
  string that pinned a building to `Previewed` for ever; a prerequisite is now
  a `BuildingKind`, and a preview ends the moment that building is complete.
- **Construction telemetry** — a typed sink with a no-op default and no
  analytics service. Six events, each fired from a **causal transition** rather
  than a render, and deduplicated by key so rerenders, StrictMode's
  double-invoke and repeated loads cannot report one twice.

### 1v.2 The seam grew commands

[ADR-0017](../adr/0017-commands-over-the-settlement-state-seam.md). Commands sit
beside `load` on `SettlementStateSource` and **return the whole resulting
state** — the shape a `POST` followed by a re-read takes. No optimistic updates,
no client-side mutation.

**Commands name intent, never amounts.** `procureConstructionShortfalls(kind)`
takes a building, not a resource and a quantity: the source works out what is
short, what it costs and what is left. A caller that could choose the quantity
could choose a wrong one.

**Duplicate confirmation is rejected, never silently ignored.** The control is
disabled while a command is in flight, and any call that arrives anyway reaches
the source, which refuses it because the building is no longer `NotBuilt`. Two
layers, because `Idempotency key` is deferred to Prompt 9.

The fake source is now **stateful** — balances and construction records that
commands mutate — while the deterministic `FakeClock` and the three scenarios
are unchanged.

### 1v.3 Deferred, with reasons

> **Read with §1u.** Three of the five rows below have since been resolved or
> retargeted: the forging half is delivered, real pricing is unchanged, and
> forging telemetry now defers to Prompt 8 rather than to work that has shipped.

| Deferred | Why |
|---|---|
| ~~The **forging half**~~ — **delivered as Prompt 6B**, §1u | Scoped out by the product owner at the time. It was as large again as the construction half, and introduced a second state machine plus destination exclusivity |
| **Worker and specialist assignment** | `Workforce` is glossary-defined as a capacity, not an inventory, and no workforce model exists. Inventing one to satisfy a bullet would have been a design decision made in passing |
| **Any limit on concurrent construction** | Undecided anywhere in the design package. `JOURNEYS.md` §1 requires a *second decision* right after the first commit, which a one-at-a-time rule would forbid — so the limit needs deciding, not assuming |
| **Real procurement pricing** | The mock uses one documented placeholder, **1 Gold per missing unit**. Bounded demand against a real economy is Prompt 10 |
| Forging telemetry — chosen technique, destination choice, time to first craft | ~~With the forging half~~ — **retargeted to Prompt 8's playtest package**, which defines what the numbers are for. The forging half shipped without it, by the product owner's decision |

### 1v.4 Two things worth knowing

**Offline disables both commands.** Beginning construction and procuring are
both unavailable offline, each with the reason beside it. That is the one
sanctioned disabled control — a shortage still *replaces* the confirm rather
than greying it out.

**The test suite runs online.** `src/test/setup.ts` rejects every fetch, which
makes the app offline, which is right for the rest of the suite — but offline
deliberately disables committing. `Construction.test.tsx` stubs a *successful*
platform probe instead, still with no network and no non-determinism, and the
offline cases re-reject it explicitly.

---

## 1w. The settlement terminology migration — uncommitted

The "House" vocabulary read as *A Song of Ice and Fire* rather than as this
game, and the product owner asked for plain settlement terminology with no
replacement proper noun. Recorded in
[ADR-0016](../adr/0016-settlement-terminology.md); **kept separate from Prompt 6
in both the implementation and the tests**, because a rename across ~37 files is
unreviewable tangled with new behaviour.

**"House" is not canon.** `project_sources/` contains zero occurrences of the
word. It comes from the Workbase (42) and the prompt sheet (30), which are the
creator's working documents — so those two files are left exactly as written,
and later prompt text saying "House" means the Settlement.

### 1w.1 The merge

`House` owned exactly one `Settlement` and nothing else, so a straight rename
would have produced `Settlement.Settlement`. The two merged into **one
`Settlement` aggregate** carrying name, kingdom, stage, buildings and resource
pool, keeping `Settlement.Id` as the identity. The glossary rule "one settlement
per House — no village spam" is now the shape of the model rather than an
invariant to police.

| From | To |
|---|---|
| `House` / `Houses` | `Settlement` / `Settlements` |
| `House Karrow`, `Ashen Reach` | `Arkazian Outpost` — one name, and no proper noun |
| House Seat | Outpost |
| `HouseHall` / "House Hall" | `CommandHall` / "Command Hall" |
| The household | Residents |
| `HouseState`, `HouseStateProvider`, `useHouseState` | `SettlementState`, `SettlementStateProvider`, `useSettlementState` |

**Routes are unchanged.** `/` and `/settlement` still address the same screens.

### 1w.2 The migration, and what it had to carry

`MergeHouseIntoSettlement` is **hand-written**, replacing the scaffolded body.
The scaffolder dropped `Houses` before reading anything out of it and renamed
`ResourceBalances.HouseId` straight to `SettlementId`, which would have left
every balance pointing at a house id that no longer identifies anything.

What the migration actually does, in order: add `Kingdom` to `Settlements` and
backfill it from `Houses`; set the settlement name to `Arkazian Outpost` rather
than copying the retired one; **carry `Buildings.Kind` from `HouseHall` to
`CommandHall`**, because the enum is persisted as a string and materialisation
would otherwise break on the next read; add a nullable `SettlementId` to
`ResourceBalances` and populate it through `Settlements.HouseId`; rebuild that
table's primary and foreign keys around it; drop the old columns; and drop
`Houses` last, once nothing references it.

`Buildings` was already keyed on `SettlementId` and needed no re-pointing.

**`Down` is lossy in exactly one place** — the settlement's original name, which
Up deliberately discards. Everything else round-trips.

### 1w.3 Proving it against a populated database

`PostgresFixture` migrates to the **latest** schema on initialisation, so
nothing sharing it can observe a populated `InitialHouseAggregate` database.
`MergeHouseIntoSettlementTests` therefore creates and drops a database of its
own, uses `IMigrator` to migrate explicitly to the initial migration, inserts
House-era rows with **raw SQL** — the current EF model has no `House` type and
could not write them — then migrates up, asserts, migrates back down, and
asserts again.

That is why the backend count moved from 32 to 33.

---

## 1z. Prompt 5 — the mocked outpost

**The first player-facing screen, from typed fake data.** No backend change, no
persistence, no authentication.

### 1z.1 Three conflicts with what Prompts 3–4 had deferred

| Prompt 5 asks for | Before | Resolution |
|---|---|---|
| Hall, storehouse, **barracks, forge** | Prompt 3 deferred both | **Seven buildings** — five raisable, Barracks and Forge previewed with their requirement. `WIREFRAMES.md` amended |
| **A named smith** | Deferred | Fake data only. Halvard Stenn, idle until a forge exists |
| **Assign or confirm production** | Prompt 10 | **Confirm** — a completed production site states what it yields, read-only. No workforce model invented |

### 1z.2 The adapter seam

The deliverable that matters most, because Prompts 10–17 depend on it:

- `api/types.ts` — `SettlementState`, the contract components see. ISO strings on the
  wire, parsed at the boundary; progress derived from timestamps.
- `api/SettlementStateProvider.tsx` — the only path to state, and the only path
  through which it changes.
- **Nothing under `features/` or `components/` may import `api/fake/`** —
  enforced by an ESLint `no-restricted-imports` rule rather than a grep test, so
  it fails in the editor. Verified by temporarily adding a violating import:
  the rule fires with its explanation.

The development time control advances the fake clock **inside the source**, then
reloads through the provider — the same path a real refetch will take.
Components observe a new `SettlementState` and never learn a clock exists.

`client.ts` and its live `/api/v1/platform/status` call are **kept** and now
drive the offline banner, so Prompt 2's proven round trip stays true rather than
being deleted.

### 1z.3 React Router was removed on evidence

It was chosen in the plan, installed, and taken out again after `npm audit`.

**Every release in the React Router 7 line currently carries at least one
high-severity advisory.** 7.18.2 reported two; pinning to 7.11.0 surfaced a
different set. Most describe SSR and framework-mode paths a client-only SPA never
reaches — but two touch `<Link>` and `useNavigate` directly, and a permanent wall
of high-severity findings teaches reviewers to ignore `npm audit`.

This slice needs two static routes. `app/router.tsx` is ~40 lines over
`history.pushState`, meets `NAVIGATION.md` §4 in full, and **`npm audit` now
reports zero vulnerabilities.** Recorded with its revisit trigger in
[ADR-0015](../adr/0015-frontend-routing-and-tests.md).

### 1z.4 Looking at it found three defects the tests did not

The app was opened in Chromium at 1280px and 375px — the first browser check in
this repository's history, after Prompts 2–4 each deferred one.

| Defect | Fix |
|---|---|
| **The site row clipped the Forge** at 1280px. Seven plots did not fit and there was no scroll affordance, so it read as broken | The row is a wrapping grid, not a scrolling flex row |
| **Mobile dropped the resource labels** via `display: none`, which removes them from the accessibility tree as well as the screen — leaving a screen-reader user and a sighted user alike with `250 200 220 180 120 100` | The bar wraps to two lines and keeps its labels |
| The mobile tab bar appeared mid-page | **Not a defect** — a full-page screenshot artefact. Measured at y=767 in an 812px viewport, correctly pinned |

The second is the one worth noting: `COMPONENTS-AND-STATES.md` said the bar
"collapses to values", and implementing that literally produced an accessibility
regression. The design package was amended rather than the implementation
quietly diverging.

### 1z.5 Node floor raised, and the machine upgraded to meet it

`jsdom@30.0.1` declares `engines: { node: '^22.22.2 || ^24.15.0 || >=26.0.0' }`,
which raised the project's floor from 22.12.0.

The development machine was on 22.18.0 and `npm ci` reported `EBADENGINE`.
**It was upgraded to 22.23.2** (`winget upgrade --id OpenJS.NodeJS.22`, same
major line, npm 10.9.3 → 10.9.8). A clean `npm ci` now installs with no engine
warning, and the full suite passes on the new runtime with a byte-identical
build artefact.

Two different things are recorded, deliberately:

| File | Value | Meaning |
|---|---|---|
| `web/package.json` `engines` | `>=22.22.2` | The **requirement** — the floor jsdom imposes |
| `.nvmrc` | `22.23.2` | The **version actually used**, locally and in CI |

Downgrading jsdom to avoid the upgrade was considered and rejected: it would
have hidden a real toolchain requirement behind an older dependency.

---

## 1a. Prompt 4 — the design package

**A package of documents. No code, no change to `web/`, no CSS.** Seven files in
[`../design/`](../design/): journeys, navigation, wireframes, visual language,
components and states, accessibility, and an index.

### 1a.1 Decisions it makes so Prompt 5 does not have to

**The first useful action — raise the Lumber Yard.** Presented on the
first-session outpost as the single filled button. **A starter-balance and
playtest hypothesis, not canon:** it is the cheapest building and timber appears
in every other cost. Nothing in `project_sources/` makes Arkazia timber-poor —
`arkazia.md` lists alpine forests beside its iron-rich slopes. Prompt 8's
playtest confirms or overturns it.

**Four domain accents, each with a non-colour cue** — settlement ash-blue,
forge ember, army crimson tint, consequence wound-red — so the acceptance
criterion about distinct identities does not rest on hue. The greyscale test is
written into `ACCESSIBILITY.md` §3.

**A single dark theme.** Forge-dark surfaces, warm firelight accents. Half the
tokens and half the contrast work of dual themes, and it matches the canon's own
description of Arkazia.

**`accent-sylvara` is reserved and unused.** The package allocates the colour for
future Sylvaran content and stops there. It assigns Sylvara **no role,
relationship or disposition**, because none of the sources this prompt works
from establishes one.

**One primary action is an onboarding device, not a law.** It holds for the
first-session outpost. Returning sessions may lead with a different action,
and several states correctly have none — an error offers a retry, not a next
move. `COMPONENTS-AND-STATES.md` §4 records which is which.

**The mobile rule:** any control that commits resources, confirms a craft or
chooses a destination is reachable in at most two taps, with no nested modal.

### 1a.2 Contrast was computed, and four colours failed

Every foreground/background pair was calculated against the WCAG relative
luminance formula rather than eyeballed. The first palette failed in four
places:

| Token | First value | Worst ratio | Corrected to | Worst ratio |
|---|---|---:|---|---:|
| `accent-army` | `#C0392F` | 2.68 | `#E97A6F` | **5.18** |
| `text-muted` | `#8A8074` | 3.75 | `#9A9083` | **4.63** |
| `danger` | `#D45C50` | 3.77 | `#E4756A` | **4.88** |
| `border-interactive` | `#7A6C5D` | 2.86 | `#8C7D6C` | **3.65** |

Canon says Arkazian *crimson cloth*, and true crimson cannot carry text on dark
ground. The token is the lightened tint; deep crimson stays available for
illustration and heraldry, where it carries no text. That trade-off is recorded
in `VISUAL-LANGUAGE.md` §2.3 rather than left as an unexplained deviation.

### 1a.3 Screens for systems that do not exist

Forge, Army and Battle report are designed here and were not built by Prompt 3.
That is intended — Prompt 4 designs the whole first experience, and Prompts 6–7
mock those parts in turn. **Navigation shows only what exists:** an area that has
not arrived is absent, never a disabled tab, because a disabled control is an
advertisement.

---

## 2. Prompt 3 scope

**One Arkazian settlement claims an outpost, constructs buildings, and manages
resources.** All 12 canon files were read in full before any code was written.

### 2.1 The prompt was deliberately narrowed

Prompt 3 as written also asks for a named smith and forge capability, an iron
sword equipment batch, a company with its equipment assignment, and a battle
input/result contract. **The product owner deferred all of them.**

The reasoning: those are precisely the models the mocked playtests (Prompts 5–8)
exist to interrogate. Committing to their shape before a tester has seen the
loop is the expensive kind of early decision, and the one the gate structure is
designed to prevent.

| Deferred | Returns at |
|---|---|
| Smith, forge capability, `ForgeCraft`, equipment batches, weapon patterns | Prompt 12 · mocked at Prompt 6 |
| Company, equipment slots, army archetypes | Prompt 13 · mocked at Prompt 7 |
| `BattleInput`, `BattleResult`, result application | Prompts 14–15 · mocked at Prompt 7 |
| Sylvaran opponent content | With the first battle |

**The prompt lists six required rules.** Two are implemented and tested; four
are deferred with the models they govern, because there is nothing for them to
apply to.

| # | Rule | State |
|---|---|---|
| 1 | Resources cannot be spent below zero | **Implemented, 5 tests** |
| 2 | A construction cannot complete twice | **Implemented, 11 tests** |
| 3 | A craft cannot complete twice | Deferred — no craft exists |
| 4 | One equipment batch has one current destination | Deferred — no batch exists |
| 5 | A batch cannot be equipped and sold simultaneously | Deferred — no batch exists |
| 6 | Battle results cannot be applied twice | Deferred — no battle exists |

**Prompt 3 is therefore not complete as written. It is complete as scoped.**

### 2.2 Delivered

- `Features/Settlements/` — `Settlement` (the aggregate root), `Kingdom`,
- `Features/Settlements/` — `Settlement`, `Building`, `BuildingKind`,
  `ConstructionStatus`, `SettlementStage`, `InvalidConstructionStateException`
- `Features/Resources/` — `ResourceKind`, `ResourcePool`, `ResourceBalance`,
  `ResourceCost`, `InsufficientResourcesException`
- `Content/` — resource and building catalogues, and the opening Arkazian settlement
- `Persistence/Configurations/`, the `InitialHouseAggregate` migration,
  `Microsoft.EntityFrameworkCore.Design`, and `.config/dotnet-tools.json`
  pinning `dotnet-ef` 10.0.10

---

## 3. Decisions worth recording

**No new ADR.** The contract asks for one when an accepted contract changes.
ADRs 0011–0014 already decide the platform shape, the persistence approach and
the content approach this work sits inside; nothing was overturned.
`ARCHITECTURE.md` §4 and §5 were updated instead — the smaller and truer change.

**Enums persist as strings, never ordinals.** Applied as a convention in
`ConfigureConventions`, so a new enum cannot be mapped as an `int` by omission.
An ordinal silently re-points every existing row the moment a member is inserted
or reordered, and tells a support query nothing. Verified by reading raw columns
back with SQL, not only the mapped properties.

**One-member enums.** `Kingdom` holds Arkazia; `SettlementStage` holds Outpost.
Canon describes seven kingdoms and five stages, but a member with nothing behind
it is exactly the unused future framework the acceptance criteria forbid.

**Buildings are cost, duration and completion — not capability.** Storehouse
capacity and production rates are Prompts 10 and 11. Barracks, Forge, Armoury
and walls are omitted entirely, because each exists to unlock a capability and
none of those capabilities is modelled.

**Content is keyed by the enums.** No parallel string-identifier scheme: nothing
resolves content by name yet, so a second naming system would be one more thing
to keep in step for no benefit.

**Generated migrations are exempt from the style rules.** A scoped
`.editorconfig` marks `Persistence/Migrations/` as generated code. Without it
`dotnet ef migrations add` produces a build error (IDE0161, block-scoped
namespace) and every future migration would need hand-editing.

**The settlement has no proper name.** Canon names Arkazia's capital (Obsidia)
and its legendary smiths (Akron and Lewis Wright) but no minor settlement. The
first version invented two — "House Karrow" of "Ashen Reach" — and both were
retired by [ADR-0016](../adr/0016-settlement-terminology.md): the outpost is
described by what it is, and naming it is the player's to do later.

---

## 4. Validation

All executed 3 August 2026. Output as returned.

```
$ dotnet format --verify-no-changes
(no output, exit code 0)

$ dotnet build -c Release
Build succeeded.
    0 Warning(s)
    0 Error(s)

$ dotnet test -c Release --no-build
Passed!  - Failed: 0, Passed: 32, Skipped: 0, Total: 32

$ dotnet ef migrations list --project src/Woo.Api
20260803111510_InitialHouseAggregate
20260804095831_MergeHouseIntoSettlement

$ cd web && npm run lint && npm run typecheck && npm run build
(clean; built in 131ms)

$ bash scripts/check-adrs.sh
checked 14 ADR(s) — OK
$ bash scripts/check-doc-links.sh
checked 35 Markdown files — OK
```

Re-run in full after the second visual pass, 4 August 2026:

```
$ dotnet format --verify-no-changes
(no output, exit code 0)

$ dotnet build -c Release
Build succeeded.  0 Warning(s)  0 Error(s)

$ dotnet test -c Release --no-build
Passed!  - Failed: 0, Passed: 32, Skipped: 0, Total: 32, Duration: 4 s

$ cd web && npm run lint && npm run typecheck
(no output from either)

$ npm run test          # three consecutive runs
Test Files  2 passed (2)      Tests  14 passed (14)      stderr: 0 bytes
Test Files  2 passed (2)      Tests  14 passed (14)      stderr: 0 bytes
Test Files  2 passed (2)      Tests  14 passed (14)      stderr: 0 bytes

$ npm run build
✓ built in 234ms — 10 SVGs emitted as real files, none inlined

$ bash scripts/check-adrs.sh
checked 15 ADR(s) — OK
$ bash scripts/check-doc-links.sh
checked 44 Markdown files — OK
```

Re-run in full after the terminology migration and Prompt 6's construction
half, 4 August 2026:

```
$ dotnet format --verify-no-changes
(no output, exit code 0)

$ dotnet build -c Release
Build succeeded.  0 Warning(s)  0 Error(s)

$ dotnet test -c Release --no-build
Passed!  - Failed: 0, Passed: 33, Skipped: 0, Total: 33

$ cd web && npm run lint && npm run typecheck
(no output from either)

$ npm run test          # three consecutive runs
Test Files  3 passed (3)      Tests  33 passed (33)      stderr: 0 bytes
Test Files  3 passed (3)      Tests  33 passed (33)      stderr: 0 bytes
Test Files  3 passed (3)      Tests  33 passed (33)      stderr: 0 bytes

$ npm run build
✓ built in 221ms

$ bash scripts/check-adrs.sh
checked 17 ADR(s) — OK
$ bash scripts/check-doc-links.sh
checked 46 Markdown files — OK
```

Re-run in full after Prompt 6B, the forging half, 4 August 2026:

```
$ docker compose -f docker/docker-compose.yml up -d
Container woo-db  Running

$ dotnet format --verify-no-changes
(no output, exit code 0)

$ dotnet build -c Release
Build succeeded.  0 Warning(s)  0 Error(s)

$ dotnet test -c Release --no-build
Passed!  - Failed: 0, Passed: 33, Skipped: 0, Total: 33, Duration: 2 s

$ dotnet ef migrations list --project src/Woo.Api
20260803111510_InitialHouseAggregate
20260804095831_MergeHouseIntoSettlement          # two, unchanged — no backend change

$ cd web && npm run lint && npm run typecheck
(no output from either)

$ npm run test          # three consecutive runs
Test Files  5 passed (5)      Tests  89 passed (89)      stderr: 0 bytes
Test Files  5 passed (5)      Tests  89 passed (89)      stderr: 0 bytes
Test Files  5 passed (5)      Tests  89 passed (89)      stderr: 0 bytes

$ npm run build
✓ built in 225ms

$ npm audit
found 0 vulnerabilities

$ bash scripts/check-adrs.sh
checked 18 ADR(s) — OK
$ bash scripts/check-doc-links.sh
checked 47 Markdown files — OK
```

The browser sweep that went with it is §4.4: **111 assertions, all passing**,
and two defects it found that nothing else did.

**The migration was proven the way a deployment meets it.**
`MergeHouseIntoSettlementTests` creates its own database, migrates it to
`InitialHouseAggregate`, inserts House-era rows with raw SQL — the current EF
model has no `House` type and could not write them — migrates up, asserts, then
migrates **back down** and asserts again. Buildings, balances, stage, kingdom
and the `HouseHall` → `CommandHall` value all survive both directions.

### 4.4 The Prompt 6B visual check

Driven with `playwright-core` against the installed Edge, from a scratch
directory outside the repository — no dependency was added to `web/`. **The whole
run is client-side navigation**: the fake source lives for one page load, so a
`goto` would silently reset the settlement and test nothing.

Captured at **1440 × 900** and **375 × 812**: the forge with nothing forged, the
craft form short and then affordable, work under way, the finished batch, the
destination decision, each state after it, the settled record revisited, all four
direct-arrival states, the primed unavailable smith, and offline. 24 screenshots.

**111 automated assertions, all passing.** Measured, not eyeballed:

| Check | Result |
|---|---|
| `documentElement.scrollWidth` at 1440, 720, 375 and 320, on every forge route and in every lifecycle state | Equal to `clientWidth` everywhere — no horizontal scroll |
| Tab order on the craft form | Every stop reports a `solid` outline |
| Interactive targets under 44px | None *(the radio input itself is exempt: its 44px label is the target)* |
| `Esc` | Leaves the craft form and the destination, spending nothing |
| The shortfall replaces the confirm | `.shortfall` present, **zero** "Begin the craft" buttons, exact amounts and price named |
| Gold as a shortfall | Never — asserted against the shortfall summary |
| Probability vocabulary | None on the craft form under any technique, nor on the settled record: no `%`, chance, odds, risk, roll, probability, likelihood |
| The contract fee | Lands in the stores exactly once |
| A settled batch | No radios and no confirm, revisited by going back |
| `prefers-reduced-motion: reduce` | All three duration tokens and every transition part compute to `0s` |
| Requests the app makes | All succeed |

#### 4.4.1 Two defects only visible by looking

Neither was caught by a passing build or a green test run, and **one of them a
test was actively asserting**.

**The maker record printed identifiers at the player.** `Pattern
pattern.sword.infantry.arkazian`, `Grade grade.iron`, `Technique
technique.standard` — codebase jargon on screen, which `COMPONENTS-AND-STATES.md`
§5 forbids outright. The test asserted those exact strings were present, so it
encoded the defect rather than catching it. The record now reads *Arkazian
infantry sword*, *Iron*, *Standard pattern*; the identifiers stay on the batch,
where later systems reconstruct the craft from them, and the test now asserts
both halves of that.

**Every button-styled link was underlined.** `.button` never reset
`text-decoration`, so an `<a class="button">` carried the anchor default and read
as a link wearing a button. **This is pre-existing from Prompt 6** — "Raise the
Lumber Yard" on the settlement screen has the same markup — and the one-line fix
in `.button` corrects both.

#### 4.4.2 One pre-existing finding, not fixed

**`/favicon.ico` returns 404 on every cold load.** `index.html` has declared no
icon since the platform bootstrap (`c1b3c98`), so the browser asks for the
default and Vite has none. Confirmed with `curl`: `/favicon.ico` → 404,
`/vite.svg` → 200. It is unrelated to forging, has no consequence beyond a blank
tab icon, and is **left for the product owner to schedule** rather than fixed
inside this prompt.

**Still not run:** axe or any automated a11y tool — deferred to the Prompt 8
audit, unchanged. The sweep above is mechanical, not a substitute.

### 4.3 The Prompt 6 visual check

The commit flow was driven in a real browser **against the running backend**,
because the platform probe decides the offline state and offline deliberately
disables committing. Captured at **1440 × 900** and **375 × 812**: the confirm
screen, the settlement immediately after a commit, a real shortage reached by
spending down, the state after procuring, and each of the four route edge
cases.

Measured on the construction flow, not eyeballed:

| Check | Result |
|---|---|
| `documentElement.scrollWidth` at 1440, 720 (≈200% zoom), 375 and 320 | Equal to `clientWidth` at every width — no horizontal scroll |
| Tab order on the confirm | Begin → Cancel → testing aid → skip link → rail. Every stop reports a `2px solid` outline |
| `Esc` | Returns to `/settlement` with focus restored to the plot that was being decided |
| Interactive targets under 44px | None. *(The breadcrumb link was 80 × 18 and now carries `min-height: var(--target-min)`.)* |
| Greyscale legibility | A shortfall row carries `⚠` beside the resource name and a negative number, so the shortage reads with no colour at all |
| `prefers-reduced-motion: reduce` | Duration tokens and the button transition all compute to `0s` |

**Still not run:** axe or any automated a11y tool — deferred to the Prompt 8
audit, unchanged.

### 4.2 The visual check

Driven with `playwright-core` against the installed Edge, from a scratch
directory outside the repository — no dependency was added to `web/`. Captured
at **1440 × 900** and **375 × 812**: first-session seat, returning seat,
settlement with the Lumber Yard selected, construction under way, construction
complete, empty, offline. Loading and error were captured by temporarily
substituting a slow source and a rejecting source in `main.tsx`; both
substitutions were reverted.

Measured, not eyeballed:

| Check | Result |
|---|---|
| `documentElement.scrollWidth` at 1440, 720 (≈200% zoom), 375 and 320 | Equal to `clientWidth` at every width, both routes — **no horizontal scroll** |
| Tab order from a cold load | Skip link → Seat → Settlement → primary action → "See all options" → testing aid. Every stop reports a `2px solid` outline |
| Keyboard selection of a plot | `Enter` on the Mine plate moves the ledge from Command Hall to Mine; `aria-pressed` follows |
| `prefers-reduced-motion: reduce` | All three duration tokens compute to `0ms`; plate and button transition durations compute to `0s`; the hover and selected transforms are neutralised |
| Interactive targets under 44px at 375px | None. *(The skip link was 141 × 42 and now carries `min-height: var(--target-min)`.)* |
| Greyscale legibility | Every construction state still separable by glyph, word and frame — solid vs dashed, base rule, and a raised plate with a lit head rail for the selected site |

**Still not run:** axe or any automated a11y tool — deferred to the Prompt 8
audit, unchanged. The sweep above is manual and mechanical, not a substitute.

**Against an empty database, then twice in a row** — the two properties the
persistence fixture exists to guarantee:

```
$ docker compose -f docker/docker-compose.yml down -v      # volume removed
$ docker compose -f docker/docker-compose.yml up -d        # healthy

$ dotnet test -c Release --no-build     # run 1, empty database → all passed
$ dotnet test -c Release --no-build     # run 2, immediately after → all passed
```

No manual migration step was needed: the fixture applies it.

**Schema, and proof the tests clean up after themselves:**

```
$ docker exec woo-db psql -U woo -d woo -c '\dt'
 public | Buildings             | table | woo
 public | Houses                | table | woo
 public | ResourceBalances      | table | woo
 public | Settlements           | table | woo
 public | __EFMigrationsHistory | table | woo
(5 rows)

$ docker exec woo-db psql -U woo -d woo -c 'SELECT ...counts...'
 houses | settlements | buildings | balances
      0 |           0 |         0 |        0
```

Four tables and nothing else, and zero rows after a full run. Column types from
the migration: enums `character varying(50)`, amounts `bigint`, timestamps
`timestamp with time zone`.

**The application still runs:**

```
$ dotnet run --project src/Woo.Api          # migrates on start, Development only
$ curl http://localhost:5080/health
{"status":"Healthy","totalDurationMs":60.3,
 "checks":[{"name":"postgresql","status":"Healthy","description":null}]}

$ curl http://localhost:5080/api/v1/platform/status
{"application":"Weapons of Chaos and Order","environment":"Development",
 "utcNow":"2026-08-03T11:19:34.8254944+00:00","database":{"connected":true}}
```

### 4.1 Not run

| Not run | Why |
|---|---|
| **Mermaid diagram rendering** | No renderer in this toolchain. The five diagrams in the design package are written to documented syntax but have **not been visually confirmed** |
| **Any human playtest** | Screens were inspected by eye and by browser; whether a first-time tester finds the next action without explanation is the **Prompt 8 gate**, and no automated check answers it |
| Frontend accessibility sweep with axe | Deferred to the Prompt 8 audit. Structure, headings, focus and greyscale legibility were built to `ACCESSIBILITY.md`, but no automated a11y tool has run |
| Anything gameplay-facing | No endpoint exposes the domain, by design |
| Mermaid diagram rendering | No renderer in the toolchain |
| Any deployment | Nothing is deployed, and it is not authorised |

---

## 5. Gates

### 5.1 `project_sources/` — closed

**All 12 canon files are present, tracked, and were read in full during
Prompt 3.** The gate that blocked Prompt 3 through Prompts 1 and 2 is closed and
does not reopen.

| File | Subject |
|---|---|
| `arkazia.md`, `draxys.md`, `lumus.md`, `nordalh.md`, `sylvara.md`, `veridor.md`, `zandres.md` | The seven kingdoms |
| `aura_levels.md` | L0 Dormant through L3; Conduit, Aspect, Dreadform, Ascendant |
| `rune_list.md` | Rune families and identities |
| `runeforged_weapons.md` | Rune vessels, weapon progression, the two-slot rule |
| `weapons_of_chaos_and_order.md` | The singular Chaos Weapons and the Order counters |
| `my_lore_inspirations.md` | The creator's inspiration notes |

**Canon is never edited to fit the code.** Where canon and an implementation
disagree, raise it rather than quietly picking one.

### 5.2 Open canon conflicts

Reading the canon confirmed the six conflicts the Workbase predicted and found
two more, plus two blank entries that are missing canon rather than
contradictions. All are recorded in
[`../domain/GLOSSARY.md §11`](../domain/GLOSSARY.md) and all remain
**unresolved**.

**None blocks current work** — the built slice has no runes, weapons or combat.
Two block Prompt 31: the Order living-anchor rule and the Chaos/Order physical
process.

---

## 6. Acceptance criteria

### Prompt 5

| # | Criterion | Result |
|---|---|---|
| 1 | A first-time tester identifies the next useful action without explanation | **Built and inspected** — one filled amber button, "Raise the Lumber Yard", the only filled control on the screen; asserted by test. **Whether a real tester agrees is the Prompt 8 gate** |
| 2 | The view feels like a medieval outpost, not a generic dashboard | **Built** — forge-dark surfaces, building silhouettes, prose copy, heraldry. **A judgement, and the product owner's to make** |
| 3 | Settlement growth is visually legible | **Met** — seven plots with ■ / ▨ / □ glyphs and words; the time control carries the Lumber Yard ▨ → ■ and adds a change entry |
| 4 | Essential decisions remain available on mobile | **Met** — inspected at 375px; no horizontal overflow; tab bar pinned; nothing desktop-only |
| 5 | No production persistence, authentication or multiplayer | **Met** — no backend change; `git status` shows nothing under `src/`; the primary action navigates and spends nothing |

### Prompt 4

| # | Criterion | Result |
|---|---|---|
| 1 | The first useful action is obvious | **Met** — one filled button on the first-session outpost, named, with its reasoning and its status as a hypothesis |
| 2 | Settlement growth, forging, army readiness and consequence have distinct visual identities | **Met** — four accents, each paired with a shape cue and a label; greyscale test defined |
| 3 | Mobile preserves all essential decisions | **Met** — the two-tap rule, a mobile wireframe per screen, no desktop-only decision |
| 4 | Specific enough for Prompt 5 without inventing the product design | **Met as far as a document can be** — literal token values, a wireframe per screen, copy per state, and a handoff contract. **Only Prompt 5 can prove this**, by finding out whether it had to invent anything |

### Prompt 3

| # | Criterion | Result |
|---|---|---|
| 1 | First-slice rules understandable and covered by focused tests | **Met** — 5 tests for the resource rule, 11 for construction |
| 2 | No unused future domain framework created | **Met** — one-member enums, no speculative folders, seams are comments |
| 3 | Starter content small, readable, replaceable | **Met** — one `Content/` folder of static C#, keyed by the enums |
| 4 | The existing application remains easy to run | **Met** — `/health` green; the suite passes from an empty database and twice in a row |
| 5 | The narrowing is visible, not silent | **Met** — §2.1 here and in [`../architecture/SLICES.md`](../architecture/SLICES.md) |

---

## 7. Assumptions and risks carried forward

| Item | Note |
|---|---|
| Host port 5433 | A native PostgreSQL 18 service occupies 5432 on the development machine. `POSTGRES_PORT` in `docker/.env` moves the container, but the API needs `ConnectionStrings__Woo` set separately. CI publishes 5433 too, so one connection string works in both places |
| Compose and application configuration are separate on purpose | No dotenv package. The .NET configuration system already layers environment variables; a second mechanism reading the same file would make it ambiguous which one wins |
| `Woo.slnx` | The modern solution format. `dotnet build`, `test`, `format` and `ef` all resolve it. Falls back to `.sln` if other tooling objects |
| Two scoped `.editorconfig` files | `tests/` disables the async-suffix naming rule for test names that read as sentences; `Persistence/Migrations/` exempts scaffolder output from the style rules |
| Feature folders are not mechanically enforced | With two projects there is nothing an architecture test could prove. Review carries it; [ADR-0011](../adr/0011-minimal-platform-shape.md) names the trigger for reopening |
| Rune leakage prevention | Not a compile-time guarantee. It holds because runes do not exist — no folder, no table, no content |
| Node is pinned to 22.23.2 while the floor is 22.22.2 | `engines` states the requirement, `.nvmrc` the version in use. Raising the floor is a deliberate act; following the 22 line's patches is not |
| Starter balance numbers are placeholders | Chosen so every first building is affordable but not all five together. Playtesting replaces them |

---

## 8. Readiness for Prompt 7

**Ready.**

| Criterion | Status |
|---|---|
| Backend green | Yes — 33 tests, format, build |
| Frontend green | Yes — 89 tests, lint, typecheck, build |
| `npm audit` | **Zero vulnerabilities** |
| The whole mocked economy loop closes | Yes — raise → craft → complete → one destination |
| The adapter seam is enforced, not merely intended | Yes — ESLint rule, verified to fire |
| Design package matches what was built | Yes — `WIREFRAMES.md` §6.1–6.3, `NAVIGATION.md`, `COMPONENTS-AND-STATES.md` §3 |
| Documentation links resolve | Yes |

**Prompt 7 builds the mocked army and battle:** one Arkazian Bastion company,
recruitment and equipment summaries, assignment of the forged batch, one local
conflict against a Sylvaran force, a deterministic event log, a PixiJS replay,
and a post-battle report ending in a repair choice.

Four things Prompt 7 should know:

- **The batch is at `state.forge.craft`**, and `craft.destination` decides
  whether the company can have it. A batch that was contracted, listed or
  retained is **not** available to equip — that is how "changing the destination
  changes battle readiness and outcome" is already wired.
- **`batch.maker` is the provenance** that must reach the battle history.
  `batch.equipmentEffectTier` is bounded 1–2 and is the intended lever; it exists
  so combat maths did not have to be decided in the forging prompt.
- **Extend the seam, do not bypass it.** New state joins `SettlementState` and
  arrives through the provider; commands return the whole resulting state and
  name intent, never amounts (ADR-0017).
- **Army and Reports are designed but not built** — `WIREFRAMES.md` §7 and §8.
  Build those rather than inventing screens, and add each area to the rail only
  when it exists, the way the Forge does.

> **Do not begin Prompt 7 without the product owner's instruction.**

---

## 9. Change log

| Date | Prompt | Summary |
|---|---|---|
| 2026-08-01 | 1 | Repository initialised. Architecture package, 10 ADRs, glossary, operations docs, slice traceability, validation scripts. |
| 2026-08-03 | 2 | Architecture package simplified: `ARCHITECTURE.md` rewritten 1,391 → 288 lines, `SLICES.md` trimmed, `docs/operations/` deleted, ADRs 0001–0010 superseded by 0011–0014. Platform bootstrapped: one ASP.NET Core application, one test project, React/Vite shell, Compose for PostgreSQL, CI. The TypeScript 7 + 6 compiler pair was removed once registry checks showed `typescript@6.0.3` is published under the plain package name. Two environment faults found by running things: PostgreSQL 18 changed the container data-directory convention, and a native PostgreSQL service was shadowing port 5432. |
| 2026-08-03 | 2 (review) | CI retargeted to `master`. `.env` documented as Compose-only, and its template moved to `docker/.env.example` — the repository root is not where Compose reads it. `project_sources/` supplied: 12 canon files verified, closing the Prompt 3 gate. |
| 2026-08-03 | 2 (cleanup) | Corrected statements the commit had made false — "pending review", "uncommitted", "the directory is untracked", and the claims that CI had never run. |
| 2026-08-03 | 3 | All 12 canon files read. First domain model: House, Outpost settlement, five buildings with construction state, the six resources with the spend rule. Static C# starter content. House-aggregate persistence with enums stored as strings, and the `InitialHouseAggregate` migration. Verified against an empty database and twice in a row. **Narrowed by the product owner**: smith, forge, batch, company and battle contracts deferred, with four of the prompt's six rules (§2.1). |
| 2026-08-03 | 3 (review) | `.claude/settings.json` untracked and `.claude/` ignored — per-machine tool permissions, not a project decision. **Ordering defect fixed:** `House.BeginConstruction` validated the duration only after spending the cost, so a zero or negative duration left the House poorer with nothing started. The guard moved ahead of the spend, proven by a test that fails against the old ordering. Status and `AGENTS.md` cleaned of claims the commits had made stale. Committed as `9483047`. |
| 2026-08-03 | 5 | The mocked House Seat, from typed fake data: House Seat with first-session and returning shapes, settlement with all seven buildings, six resources, a named smith, seven states. The typed adapter seam with the fake-import boundary enforced by ESLint. Placeholder SVG art with a terminating fallback chain, the Forge asset deliberately absent. 14 frontend tests; Vitest added. **React Router removed on evidence** — every 7.x release carries a high-severity advisory; replaced by a ~40-line History-API router, `npm audit` now clean. **First browser inspection in the repository's history**, which found a clipped site row and an accessibility regression in the mobile resource bar; both fixed and the design package amended. Node floor raised to 22.22.2 for jsdom 30. |
| 2026-08-03 | 4 | The design package — seven documents in `docs/design/`, no code. Journeys, navigation, wireframes for six screens on both viewports, visual language with computed contrast, components and states, accessibility. Four colours corrected after the first palette failed AA. The first useful action proposed as a **starter-balance hypothesis, not canon**; `accent-sylvara` reserved with no role assigned. |
| 2026-08-04 | terminology | **"House" retired.** `House` and `Settlement` merged into one aggregate; House Seat → Outpost, House Hall → Command Hall, household → Residents, `HouseState` → `SettlementState`. "House Karrow" and "Ashen Reach" both dropped for `Arkazian Outpost` — no replacement proper noun, and the player names it later. A hand-written `MergeHouseIntoSettlement` migration carries the data, including `Buildings.Kind` from `HouseHall` to `CommandHall` because the enum is stored as a string; an isolated test proves it up and down against a populated database. The Workbase, the prompt sheet and `project_sources/` are untouched. [ADR-0016](../adr/0016-settlement-terminology.md). Behaviour-neutral: 14 frontend tests unchanged but for their vocabulary, backend 32 → 33. |
| 2026-08-04 | 6B (forging half) | The ordinary forging loop, mocked, closing Prompt 6. A Forge area that appears with its building and is absent rather than disabled before it; the kingdom request for 100 infantry swords for a Bastion company attached to the Red Bastion, paying 400 Gold, its three days stated as context and read by nothing; pattern, grade, technique and the named smith, with cost, duration, the **guaranteed** quality floor, the equipment effect and the coming destination decision all stated before the confirm; spend and craft creation in one transition; completion resolved on read; and **exactly one irreversible destination**. `ForgeCraft` is a discriminated union, so a batch in two places, an unfinished craft holding a batch, and an equipped batch with an asking price are states the type cannot express — [ADR-0018](../adr/0018-forging-state-machine-and-exclusive-destination.md). The batch is **exactly** the guaranteed floor, never above it, and no probability vocabulary exists in the feature — no `%`, no chance, odds, risk, roll or probability — asserted mechanically across all three screens. One craft only, because a second would overwrite the batch Prompt 7 reads. The unavailable-specialist case got its own primed scenario, since a smith busy at the anvil only ever proves that a second craft is refused. `Sound` was rejected as a quality tier because `rune_list.md` names Sound as a rune. Three stale documents corrected — `AGENTS.md`, this file and `SLICES.md` all still described `21d6310` and `f35f797` as uncommitted — along with a Prompt 6 test that asserted the Forge introduced no forging, a duplicated procurement rate, and an `eslint.config.js` comment the ADR-0016 rename had missed. Frontend only: 33 → 89 tests, no backend change, no migration. |
| 2026-08-04 | 6 (construction half) | The commit flow closes the loop for the first time: a confirm route at `/settlement/<site>` stating cost, what it leaves, duration with the completion time and the non-cancellable boundary; **spend at confirm**, whole cost, all-or-nothing, in the same transition that starts the work; shortages that **replace** the confirm with an all-or-nothing procure action at a documented placeholder of 1 Gold per missing unit, with Gold itself never procurable; completion resolved on read; and the Command Hall ending the Barracks and Forge previews. The seam grew commands that return the whole resulting state and name intent rather than amounts — [ADR-0017](../adr/0017-commands-over-the-settlement-state-seam.md). Construction telemetry through a typed no-op sink, six events keyed to causal transitions so rerenders and StrictMode cannot duplicate one. 19 new frontend tests (14 → 33). **The forging half, worker assignment, any concurrency limit and real pricing are deferred with reasons** (§1v.3). Making construction possible also exposed a stale claim on the returning outpost — "everything you can start is already under way" while four plots stood empty — so the next task is now the cheapest affordable site rather than always the Lumber Yard. |
