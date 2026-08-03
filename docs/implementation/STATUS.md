# Implementation status

**Last updated:** 3 August 2026
**Current stage:** Prompt 5 — the mocked House Seat ·
**complete, uncommitted, awaiting review**
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
| 5 | *uncommitted* | The mocked House Seat, from typed fake data |

`master` is level with `origin/master`. **CI is green on every pushed commit**,
verified against the GitHub Actions API on 3 August 2026:

```
97248cb  validate  completed  success
bb1a1fa  validate  completed  success
a1067a7  validate  completed  success
```

---

## 1. What exists

**One ASP.NET Core 10 application, one PostgreSQL database, one React client.**

| Area | State |
|---|---|
| Domain | `Houses`, `Settlements`, `Resources` feature folders — plain C#, no EF attributes, no clock reads |
| Content | `Content/` — static C# catalogues keyed by the enums |
| Persistence | The House aggregate: `Houses`, `Settlements`, `Buildings`, `ResourceBalances`, applied by the `InitialHouseAggregate` migration |
| API | `/health` and `/api/v1/platform/status` only. **No endpoint exposes the domain** |
| Tests | 32 backend, 14 frontend |
| CI | `validate.yml` on `master` — backend against a real PostgreSQL service container, frontend, docs |
| Canon | 12 files in [`project_sources/`](../../project_sources/), **present and read in full** |
| Design | Seven documents in [`../design/`](../design/), amended twice by Prompt 5 |
| Web | House Seat and settlement over **typed fake data**. No API over the domain, nothing saved |

**Not built:** forge, smith, crafts, equipment batches · companies, armies,
battles · runes in any form · markets, contracts, Orders, Warfronts, seasons ·
settlement stages beyond Outpost · the other six kingdoms · resource accrual,
storage capacity, procurement · authentication · background jobs, outbox,
idempotency keys · object storage · PixiJS · Azure, deployment, Kubernetes.

---

## 1z. Prompt 5 — the mocked House Seat

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

- `api/types.ts` — `HouseState`, the contract components see. ISO strings on the
  wire, parsed at the boundary; progress derived from timestamps.
- `api/HouseStateProvider.tsx` — the only path to state, and the only path
  through which it changes.
- **Nothing under `features/` or `components/` may import `api/fake/`** —
  enforced by an ESLint `no-restricted-imports` rule rather than a grep test, so
  it fails in the editor. Verified by temporarily adding a violating import:
  the rule fires with its explanation.

The development time control advances the fake clock **inside the source**, then
reloads through the provider — the same path a real refetch will take.
Components observe a new `HouseState` and never learn a clock exists.

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
first-session House Seat as the single filled button. **A starter-balance and
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
first-session House Seat. Returning sessions may lead with a different action,
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

**One Arkazian House establishes an outpost, constructs buildings, and manages
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

- `Features/Houses/` — `House` (the aggregate root), `Kingdom`
- `Features/Settlements/` — `Settlement`, `Building`, `BuildingKind`,
  `ConstructionStatus`, `SettlementStage`, `InvalidConstructionStateException`
- `Features/Resources/` — `ResourceKind`, `ResourcePool`, `ResourceBalance`,
  `ResourceCost`, `InsufficientResourcesException`
- `Content/` — resource and building catalogues, and the opening Arkazian House
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

**The House and outpost names are invented, not canon.** Canon names Arkazia's
capital (Obsidia) and its legendary smiths (Akron and Lewis Wright) but no minor
House, so "House Karrow" of "Ashen Reach" are placeholders, labelled as such in
the file.

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

$ cd web && npm run lint && npm run typecheck && npm run build
(clean; built in 131ms)

$ bash scripts/check-adrs.sh
checked 14 ADR(s) — OK
$ bash scripts/check-doc-links.sh
checked 35 Markdown files — OK
```

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
| 1 | The first useful action is obvious | **Met** — one filled button on the first-session House Seat, named, with its reasoning and its status as a hypothesis |
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
- **Extend the seam, do not bypass it.** New state joins `HouseState` and
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
