# Implementation status

**Last updated:** 3 August 2026
**Current stage:** Prompt 3 — House, outpost, buildings and resources ·
**complete and committed** (`97248cb`)
**Next:** Prompt 4 — Foundations of Iron UX and visual design

This document describes **what is true now**. The history of how it got here is
in the [change log](#9-change-log).

| Prompt | Commit | Contents |
|---|---|---|
| 1 | `db4a387`, `5142962` | Repository initialised; the first architecture package |
| 2 | `c1b3c98` | Platform bootstrap and the simplified architecture package |
| 2 | `a1067a7` | Review corrections and the 12 canon files |
| 3 | `bb1a1fa`, `97248cb` | The first domain model, starter content and migration |

`master` is level with `origin/master`. **CI is green on every commit**,
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

**Not built:** forge, smith, crafts, equipment batches · companies, armies,
battles · runes in any form · markets, contracts, Orders, Warfronts, seasons ·
settlement stages beyond Outpost · the other six kingdoms · resource accrual,
storage capacity, procurement · authentication · background jobs, outbox,
idempotency keys · object storage · PixiJS · Azure, deployment, Kubernetes.

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
| Any browser check of the web shell | Prompt 3 changed no frontend code. The shell's behaviour was last verified by `curl` through the Vite proxy at Prompt 2; the rendered page has never been opened by a human or a browser test |
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

## 8. Readiness for Prompt 4

**Ready.** Prompt 3 stopped at the platform gate: are the repository, feature
folders and first contracts ready for gameplay?

| Criterion | Status |
|---|---|
| Platform runs from a clean checkout | Yes |
| Backend, tests, format, lint, typecheck and build all green | Yes — 32 tests |
| CI green on the committed state | Yes — verified via the Actions API |
| Schema applies to an empty database with no manual step | Yes |
| The suite is repeatable and leaves no data behind | Yes — verified twice in a row |
| Architecture documentation matches what exists | Yes |
| Decision record current and consistent | Yes — 0011–0014 accepted, no new ADR needed |
| Glossary reconciled with canon for the built slice | Yes, with the conflict register |
| Canon present and read | Yes — all 12 files |
| No secrets, no deferred infrastructure | Yes |

**Prompt 4 delivers a design package, not code:** first-session and returning
journeys, information architecture, low-fidelity wireframes, a grounded Arkazian
visual direction, tokens, a component inventory, desktop and mobile layouts, and
the loading, empty, error and offline states.

Two things Prompt 4 should know:

- **The domain has no API surface.** Nothing is reachable from the browser yet,
  by design — Prompt 5 builds the mocked screens over typed fake data.
- **The design covers systems this prompt did not build** — forge, army, battle
  report. That is correct: Prompt 4 designs the whole first experience, and
  Prompts 6–7 mock the parts the domain has not reached.

> **Do not begin Prompt 4 without the product owner's instruction.**

---

## 9. Change log

| Date | Prompt | Summary |
|---|---|---|
| 2026-08-01 | 1 | Repository initialised. Architecture package, 10 ADRs, glossary, operations docs, slice traceability, validation scripts. |
| 2026-08-03 | 2 | Architecture package simplified: `ARCHITECTURE.md` rewritten 1,391 → 288 lines, `SLICES.md` trimmed, `docs/operations/` deleted, ADRs 0001–0010 superseded by 0011–0014. Platform bootstrapped: one ASP.NET Core application, one test project, React/Vite shell, Compose for PostgreSQL, CI. The TypeScript 7 + 6 compiler pair was removed once registry checks showed `typescript@6.0.3` is published under the plain package name. Two environment faults found by running things: PostgreSQL 18 changed the container data-directory convention, and a native PostgreSQL service was shadowing port 5432. |
| 2026-08-03 | 2 (review) | CI retargeted to `master`. `.env` documented as Compose-only, and its template moved to `docker/.env.example` — the repository root is not where Compose reads it. `project_sources/` supplied: 12 canon files verified, closing the Prompt 3 gate. |
| 2026-08-03 | 2 (cleanup) | Corrected statements the commit had made false — "pending review", "uncommitted", "the directory is untracked", and the claims that CI had never run. |
| 2026-08-03 | 3 | All 12 canon files read. First domain model: House, Outpost settlement, five buildings with construction state, the six resources with the spend rule. Static C# starter content. House-aggregate persistence with enums stored as strings, and the `InitialHouseAggregate` migration. Verified against an empty database and twice in a row. **Narrowed by the product owner**: smith, forge, batch, company and battle contracts deferred, with four of the prompt's six rules (§2.1). |
| 2026-08-03 | 3 (review) | `.claude/settings.json` untracked and `.claude/` ignored — per-machine tool permissions, not a project decision. **Ordering defect fixed:** `House.BeginConstruction` validated the duration only after spending the cost, so a zero or negative duration left the House poorer with nothing started. The guard moved ahead of the spend, proven by a test that fails against the old ordering. Status and `AGENTS.md` cleaned of claims the commits had made stale. |
