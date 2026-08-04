# Implementation status

**Last updated:** 4 August 2026
**Current stage:** Prompt 5 — the mocked outpost, **committed** (`f6214a6`, `3934729`)
**Uncommitted:** the settlement terminology migration
**Next:** Prompt 6 — the mocked construction and forging loop

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

**CI is green on every pushed commit**, verified against the GitHub Actions API
on 3 August 2026. `3934729` was committed locally on 4 August and its CI result
is not recorded here:

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
| Tests | 33 backend, 14 frontend |
| CI | `validate.yml` on `master` — backend against a real PostgreSQL service container, frontend, docs |
| Canon | 12 files in [`project_sources/`](../../project_sources/), **present and read in full** |
| Design | Seven documents in [`../design/`](../design/), amended twice by Prompt 5 |
| Web | The outpost and its site over **typed fake data**. No API over the domain, nothing saved |

**Not built:** forge, smith, crafts, equipment batches · companies, armies,
battles · runes in any form · markets, contracts, Orders, Warfronts, seasons ·
settlement stages beyond Outpost · the other six kingdoms · resource accrual,
storage capacity, procurement · authentication · background jobs, outbox,
idempotency keys · object storage · PixiJS · Azure, deployment, Kubernetes.

---

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

Re-run in full after the terminology migration, 4 August 2026:

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
Test Files  2 passed (2)      Tests  14 passed (14)      stderr: 0 bytes
Test Files  2 passed (2)      Tests  14 passed (14)      stderr: 0 bytes
Test Files  2 passed (2)      Tests  14 passed (14)      stderr: 0 bytes

$ npm run build
✓ built in 221ms

$ bash scripts/check-adrs.sh
checked 16 ADR(s) — OK
$ bash scripts/check-doc-links.sh
checked 45 Markdown files — OK
```

**The migration was proven the way a deployment meets it.**
`MergeHouseIntoSettlementTests` creates its own database, migrates it to
`InitialHouseAggregate`, inserts House-era rows with raw SQL — the current EF
model has no `House` type and could not write them — migrates up, asserts, then
migrates **back down** and asserts again. Buildings, balances, stage, kingdom
and the `HouseHall` → `CommandHall` value all survive both directions.

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

## 8. Readiness for Prompt 6

**Ready.**

| Criterion | Status |
|---|---|
| Backend green | Yes — 32 tests, format, build |
| Frontend green | Yes — 14 tests, lint, typecheck, build |
| `npm audit` | **Zero vulnerabilities** |
| App inspected in a browser at both widths | Yes — three defects found and fixed |
| The adapter seam is enforced, not merely intended | Yes — ESLint rule, verified to fire |
| Design package matches what was built | Yes — amended in two places |
| Documentation links resolve | Yes |

**Prompt 6 builds the mocked construction and forging loop:** reserving
resources, understanding shortages, completing a construction, choosing a
pattern, grade, technique and smith, and one exclusive destination.

Three things Prompt 6 should know:

- **The commit flow does not exist.** Prompt 5 shows buildings and their costs;
  nothing spends, and the primary action only navigates. Prompt 6 owns confirm.
- **Extend the seam, do not bypass it.** New state joins `SettlementState` and
  arrives through the provider. The ESLint rule will stop a fixture import.
- **The construction confirm screen is already designed** —
  `WIREFRAMES.md` §5, including the "after" column and the non-cancellable
  boundary. Build that rather than inventing one.

> **Do not begin Prompt 6 without the product owner's instruction.**

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
