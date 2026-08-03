# Implementation status

**Last updated:** 3 August 2026
**Current stage:** Prompt 4 — UX and visual design ·
**complete, uncommitted, awaiting design approval**
**Next:** Prompt 5 — the mocked House Seat and outpost onboarding

This document describes **what is true now**. The history of how it got here is
in the [change log](#9-change-log).

| Prompt | Commit | Contents |
|---|---|---|
| 1 | `db4a387`, `5142962` | Repository initialised; the first architecture package |
| 2 | `c1b3c98` | Platform bootstrap and the simplified architecture package |
| 2 | `a1067a7` | Review corrections and the 12 canon files |
| 3 | `bb1a1fa`, `97248cb` | The first domain model, starter content and migration |
| 3 | `9483047` | Review corrections — the construction ordering defect |
| 4 | *uncommitted* | The design package — documents only |

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
| Web | A neutral structural shell. Untouched by Prompt 3 |
| Tests | 32, in one project |
| CI | `validate.yml` on `master` — backend against a real PostgreSQL service container, frontend, docs |
| Canon | 12 files in [`project_sources/`](../../project_sources/), **present and read in full** |
| Design | Seven documents in [`../design/`](../design/) — the first playable experience, designed but not built |

**Not built:** forge, smith, crafts, equipment batches · companies, armies,
battles · runes in any form · markets, contracts, Orders, Warfronts, seasons ·
settlement stages beyond Outpost · the other six kingdoms · resource accrual,
storage capacity, procurement · authentication · background jobs, outbox,
idempotency keys · object storage · PixiJS · Azure, deployment, Kubernetes.

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
| **Any human read of the design package** | It is an argument, not a result. Nothing in it is proven until a person reads the screens and a tester plays them — that is the Prompt 8 gate |
| Any browser check of the web shell | Prompt 3 and Prompt 4 changed no frontend code. The shell's behaviour was last verified by `curl` through the Vite proxy at Prompt 2; the rendered page has never been opened by a human or a browser test |
| Frontend tests | No test runner exists — Prompt 5 |
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
| The web shell has never been opened in a browser | See §4.1. It will be exercised properly from Prompt 5 |
| Starter balance numbers are placeholders | Chosen so every first building is affordable but not all five together. Playtesting replaces them |

---

## 8. Readiness for Prompt 5

**Ready, pending design approval.** Prompt 4 stops at a design gate, not a
technical one — the package is an argument about the product, and only a person
can accept it.

| Criterion | Status |
|---|---|
| Design package complete against every listed deliverable | Yes — seven documents |
| Every Prompt 4 acceptance criterion answered | Yes — §6 |
| Tokens carry literal values, contrast computed | Yes — four colours corrected to reach AA |
| Code untouched and still green | Yes — 32 tests, format, lint, typecheck, build |
| Platform runs from a clean checkout | Yes |
| Canon present and read | Yes — all 12 files |
| Documentation links resolve | Yes |
| **Design approved by the product owner** | **No — this is the gate** |

**Prompt 5 builds the mocked House Seat and outpost onboarding** over typed fake
data, from the approved package.

Three things Prompt 5 should know:

- **Read [`../design/README.md`](../design/README.md) first.** It carries the
  handoff contract: which document answers which question.
- **Prompt 5 creates `tokens.css`** from `VISUAL-LANGUAGE.md`. Prompt 4 left no
  code behind because it ended at "stop for design approval".
- **A gap in the package is a defect in the package.** Fix it there rather than
  inventing an answer inside a component — a decision made in passing inside a
  component is a decision nobody reviewed.

> **Do not begin Prompt 5 without the product owner's instruction.**

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
| 2026-08-03 | 4 | The design package — seven documents in `docs/design/`, no code. Journeys, navigation, wireframes for six screens on both viewports, visual language with computed contrast, components and states, accessibility. Four colours corrected after the first palette failed AA. The first useful action proposed as a **starter-balance hypothesis, not canon**; `accent-sylvara` reserved with no role assigned. |
