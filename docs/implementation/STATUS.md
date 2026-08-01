# Implementation status

**Last updated:** 1 August 2026
**Current stage:** Prompt 1 — Tech stack and architecture · **complete**
**Next:** Prompt 2 — Create the platform and bootstrap the repository ·
**awaiting product owner instruction**

---

## 1. Scope of this change

Prompt 1 is **architecture only**. This change set produced the architecture
package and the accepted decision records, and nothing else.

**Delivered**

- Git repository initialised with baseline hygiene files
- `AGENTS.md` — repository instructions and the standing agent contract
- `docs/architecture/ARCHITECTURE.md` — 15 sections, 9 diagrams
- `docs/architecture/SLICES.md` — Prompt 2–32 traceability
- `docs/adr/0001`–`0010` plus an index
- `docs/domain/GLOSSARY.md` — vocabulary and the open canon register
- `docs/operations/RUNBOOK.md`, `RESTORE.md`, `COST.md`
- `scripts/check-doc-links.sh`, `scripts/check-adrs.sh`

**Deliberately not delivered** — no application code, no `package.json`, no
`.csproj`, no `global.json`, no Dockerfile, no CI workflow, no installed
dependency, no provisioned infrastructure. Those are Prompt 2.

---

## 2. Decisions made

| # | Decision | ADR |
|---|---|---|
| 1 | ASP.NET Core 10 modular monolith plus a .NET worker; Option A over Next.js | [0001](../adr/0001-platform-and-runtime-shape.md) |
| 2 | React 19, Vite 8, the TypeScript 7 + 6 compiler pair, PixiJS isolated | [0002](../adr/0002-frontend-stack.md) |
| 3 | PostgreSQL 18, **one `WooDbContext`**, six grouped schemas, EF Core writes with raw SQL reads | [0003](../adr/0003-persistence.md) |
| 4 | **Synchronous same-transaction cross-module calls; outbox for post-commit reactions only**; `SKIP LOCKED` jobs; generic idempotency sealing | [0004](../adr/0004-consistency-and-durable-work.md) |
| 5 | `IClock`, project-owned PCG with named streams, banned-API analyzer, the battle contract | [0005](../adr/0005-determinism.md) |
| 6 | Module tiers, the **Runes-removability test**, `ForgeCraft` separate from `RuneforgingAttempt` | [0006](../adr/0006-module-boundaries-and-progression-order.md) |
| 7 | Versioned JSON content, stable string IDs, **reference-driven version retention**, terminating asset fallbacks | [0007](../adr/0007-content-and-assets.md) |
| 8 | REST `/api/v1`, ETag concurrency, polling with a server-computed hint, the authorization boundary without authentication | [0008](../adr/0008-api-and-access-boundary.md) |
| 9 | **Stable seasonal schema with `season_id`**, no FK permanent → seasonal, archival as an audited job | [0009](../adr/0009-permanent-versus-seasonal-data.md) |
| 10 | Docker Compose locally, Azure Container Apps topology, testing pyramid, CI gates, cost controls | [0010](../adr/0010-environments-delivery-and-cost.md) |

### Corrections applied during review

Five decisions in the first draft were wrong and were corrected before
acceptance:

| Draft error | Correction |
|---|---|
| `typescript` aliased to TS 7, `@typescript/native` to TS 6 | **Reversed.** Tools resolve the bare `typescript` specifier, so that name must hold the package with an API — TypeScript 6 |
| ~18 DbContexts and ~18 schemas | **One `WooDbContext`, six grouped schemas** |
| Cross-module writes routed through the outbox | **Corrected.** Anything whose failure must undo the decision is synchronous and in the same transaction |
| Ordinary forging modelled as a shared `RiskAttempt` | **Separated.** `ForgeCraft` has no probability model; they share idempotency infrastructure only |
| Dynamic `season_<n>` schemas with `DROP SCHEMA CASCADE` | **Replaced** with a stable schema and `season_id` |
| A fixed cap of two loaded content versions | **Replaced** with reference-driven retention |
| `global.json` pinned to `10.0.2xx` | **Pinned exactly** to `10.0.200` |

---

## 3. Validation actually run

All commands below were executed on 1 August 2026. Output is recorded as
returned.

### 3.1 Toolchain

```
$ dotnet --list-sdks
9.0.301 [C:\Program Files\dotnet\sdk]
10.0.100 [C:\Program Files\dotnet\sdk]
10.0.200 [C:\Program Files\dotnet\sdk]

$ dotnet --list-runtimes
Microsoft.AspNetCore.App 8.0.17 / 9.0.6 / 10.0.0 / 10.0.4
Microsoft.NETCore.App    8.0.17 / 9.0.6 / 10.0.0 / 10.0.4

$ node --version && npm --version
v22.18.0
10.9.3

$ docker --version && docker compose version
Docker version 28.5.1, build e180ab8
Docker Compose version v2.40.3-desktop.1

$ git --version
git version 2.50.1.windows.1

$ az version
azure-cli 2.78.0
```

| Requirement | Installed | Status |
|---|---|---|
| .NET SDK 10.0.200 | 10.0.200 | **Satisfied** |
| .NET runtime 10.0 | 10.0.4 | **Satisfied** |
| **Node.js 24 LTS** | **22.18.0** | **ACTION REQUIRED before Prompt 2** |
| Docker Compose v2.40+ | v2.40.3 | Satisfied |
| Azure CLI | 2.78.0 | Satisfied (unused until Prompt 29) |

> Node 22.18.0 satisfies Vite 8's minimum (≥ 22.12), so it is not blocking. The
> architecture selects Node 24 because it is Active LTS. **Upgrade before
> Prompt 2 creates `.nvmrc`.**

### 3.2 Package versions — read-only registry queries, nothing installed

```
$ npm view <spec> version
typescript@7                 7.0.2
@typescript/typescript6      6.0.2
react                        19.2.8
vite                         8.2.0
@vitejs/plugin-react         6.0.5
pixi.js                      8.19.0

$ npm view @typescript/native version
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/@typescript%2fnative

$ npm view typescript@7.0.2 bin
{ tsc: 'bin/tsc' }

$ npm view @typescript/typescript6@6.0.2 bin
{ tsc6: 'bin/tsc6' }

$ npm view typescript-eslint peerDependencies
{
  eslint: '^8.57.0 || ^9.0.0 || ^10.0.0',
  typescript: '>=4.8.4 <6.1.0'
}

$ npm view typescript dist-tags
{ latest: '7.0.2', rc: '7.0.1-rc', beta: '6.0.0-beta',
  next: '7.1.0-dev.20260801.1', ... }
```

Every pinned version resolves. Three results are worth calling out:

1. **The `@typescript/native` 404 is expected and correct.** It is not a
   published package — it is an arbitrary *local alias name*. In `npm:` alias
   syntax the left side names the folder and the right side is what is
   installed, so `"@typescript/native": "npm:typescript@^7.0.2"` installs real
   TypeScript 7. Documented in ARCHITECTURE.md §2.1 so nobody tries to "fix" it.
2. **The bin entries confirm no collision.** TypeScript 7 declares `tsc`; the
   TypeScript 6 compatibility package declares `tsc6`. Under the alias
   arrangement `npx tsc` runs 7, `npx tsc6` runs 6, and the bare specifier
   `typescript` resolves to 6 for `typescript-eslint`.
3. **`typescript-eslint` peer range is `>=4.8.4 <6.1.0`** — TypeScript 7 is
   excluded outright. The compiler pair is a hard installation constraint, not a
   stylistic preference.

`typescript@next` at `7.1.0-dev` confirms 7.1 is in active development, which is
the ADR-0002 collapse trigger.

### 3.3 Container images — read-only manifest inspection, nothing pulled

```
$ docker manifest inspect postgres:18-alpine                     → OK
$ docker manifest inspect mcr.microsoft.com/dotnet/aspnet:10.0   → OK
$ docker manifest inspect mcr.microsoft.com/azure-storage/azurite → OK
```

### 3.4 Documentation checks

```
$ bash scripts/check-adrs.sh
0001-platform-and-runtime-shape.md: ok
0002-frontend-stack.md: ok
0003-persistence.md: ok
0004-consistency-and-durable-work.md: ok
0005-determinism.md: ok
0006-module-boundaries-and-progression-order.md: ok
0007-content-and-assets.md: ok
0008-api-and-access-boundary.md: ok
0009-permanent-versus-seasonal-data.md: ok
0010-environments-delivery-and-cost.md: ok

checked 10 ADR(s)
OK: every ADR is complete
```

```
$ bash scripts/check-doc-links.sh
checked 21 Markdown files
OK: all relative links resolve
```

The link check failed on its first run with two broken links, both pointing at
this file before it existed. Recorded because a check that has never failed has
not been shown to work.

### 3.5 Secrets

`.gitignore` covers `.env*` (except `.env.example`),
`appsettings.*.local.json`, `secrets.json`, `*.pfx`, `*.pem`, `*.key`. No
credential, connection string or key is committed. **gitleaks is a Prompt 2 CI
gate** and has not been run — there is nothing yet for it to scan.

---

## 4. What was NOT run, and why

The Global Agent Contract forbids claiming a check passed unless it was
executed. These could not run, because the code they validate does not exist:

| Not run | Blocked by | Arrives |
|---|---|---|
| `dotnet format --verify-no-changes` | No `.csproj` | Prompt 2 |
| `dotnet build -c Release` | No solution | Prompt 2 |
| `dotnet test` | No test project | Prompt 2 |
| `npm ci`, `typecheck`, `lint`, `test`, `build` | No `package.json` | Prompt 2 |
| Testcontainers integration tests | No persistence layer | Prompt 9 |
| `content:validate` | No content or validator | Prompt 3 |
| gitleaks | Nothing to scan | Prompt 2 |
| **Mermaid diagram rendering** | No renderer in the toolchain | **Prompt 2 CI** |
| Any deployment | Nothing built; **and not authorized** | Prompt 29 |

> **The nine Mermaid diagrams have not been rendered.** They are written to the
> documented syntax but have not been visually verified. Adding a Mermaid lint
> step is a Prompt 2 CI task.

---

## 5. Open gates and blockers

### 5.1 `project_sources/` — blocks Prompt 3

**Status: OPEN.** The directory does not exist in this repository, and a search
of `d:\Workspace` and the user profile found no copy anywhere on the machine.

Both planning documents name it as the canon source. Prompt 3 defines rune
families, rarity classes, fusion compatibility, destructibility policy, Aura
metadata, kingdom definitions and named-material catalogues — all canon-derived.

**Decision taken (product owner, 1 August 2026):** proceed with Prompt 1, which
is architecture-only, and treat this as a hard gate before Prompt 3. The
Workbase carries enough rune canon for architecture (§9 categories and
destructibility, §10 L0–L3, §16 Chaos and Order, §23 conflicts).

- **Prompt 2 is unaffected** — the platform bootstrap needs no lore.
- **Prompt 3 must not start** until the directory is present and read.
- `docs/domain/GLOSSARY.md` is therefore **incomplete on lore specifics** and
  says so.
- Sibling repositories (`d:\Workspace\WOO\docs` and others) contain kingdom lore
  but are **separate earlier projects and are not treated as canon**.

### 5.2 Node.js upgrade — before Prompt 2

Installed 22.18.0; architecture selects Node 24 LTS. Not blocking (Vite 8 needs
≥ 22.12) but `.nvmrc` will pin 24, so upgrade first.

### 5.3 Open canon conflicts

The nine Workbase §23 conflicts are recorded in
[`../domain/GLOSSARY.md §10`](../domain/GLOSSARY.md#10-open-canon-register) with
the handling for each. **None has been resolved by this change set.** Two block
Prompt 31: the Order living-anchor rule (§23.4) and the Chaos/Order physical
process (§23.7).

---

## 6. Assumptions

| Assumption | Basis | If wrong |
|---|---|---|
| Azure cost estimates are order-of-magnitude | Not verified against the pricing calculator for a chosen region | Re-verify at Prompt 29; COST.md flags this |
| ~10 s average worker drain at 20 players | Estimated from expected job volume, not measured | The cron cadence is a documented knob; measure at Prompt 18 |
| 2 requests/second polling load | 20 players at a 10 s cadence | Above the 2M free request grant; `304` responses and the poll hint reduce it. Measure at Prompt 29 |
| PCG32 is the right PRNG | Published algorithm, small state, easy to reimplement | Any documented fixed algorithm works; golden vectors would need regenerating |
| Six schemas are the right grouping | Judgement call | Moving a table between schemas is a migration, not a redesign |
| Node 24 remains Active LTS through the closed test | Node 26 becomes LTS around October 2026 | Node 24 moves to Maintenance LTS, still supported |

---

## 7. Risks carried forward

| Risk | Mitigation | Owner |
|---|---|---|
| `project_sources/` never materialises | Prompt 3 is gated; escalate rather than inventing canon | Product owner |
| Modular monolith decays without enforcement | Architecture tests are a **Prompt 2 deliverable**, not a later nicety | Prompt 2 |
| Mermaid diagrams contain syntax errors | Add a render step to Prompt 2 CI | Prompt 2 |
| TypeScript compiler pair confuses a newcomer | Documented in ARCHITECTURE.md §2.1 and ADR-0002, including the 404 | — |
| Cost estimates prove low | Budgets at $10/month and $80 total with alerts at 50/80/100 % | Prompt 29 |
| Invariants documented but never tested | Every invariant in §15 names its proving test and prompt | Each prompt |

---

## 8. Readiness for Prompt 2

**Ready**, with one action first.

| Criterion | Status |
|---|---|
| Architecture documented and accepted | Yes |
| ADRs accepted, complete, indexed | Yes — 10/10 verified |
| Repository layout defined | Yes — [ARCHITECTURE.md §16](../architecture/ARCHITECTURE.md#16-repository-layout) |
| Module boundaries and dependency direction defined as **testable statements** | Yes — the Runes-removability test is the key one |
| Critical invariants registered with enforcing mechanism **and** proving test | Yes — 30 invariants |
| Versions selected with sources and support horizons | Yes — verified against the registry |
| Local development topology defined | Yes |
| Azure topology and cost controls defined | Yes — nothing provisioned |
| No secrets committed | Yes |
| No application code, dependencies or deployment | Confirmed |
| **Node 24 installed** | **No — upgrade from 22.18.0 first** |

**Prompt 2 will deliver:** the repository tree, `global.json` pinned to
`10.0.200`, `Directory.Build.props`, `Directory.Packages.props`, the solution,
the React/Vite web shell, API health endpoints, the worker heartbeat, Docker
Compose, configuration validation, structured logging, **the architecture
tests**, and CI.

> **Do not begin Prompt 2 without the product owner's instruction.**

---

## 9. Change log

| Date | Prompt | Summary |
|---|---|---|
| 2026-08-01 | 1 | Repository initialised. Architecture package, 10 ADRs, glossary, operations docs, slice traceability, validation scripts. Five draft decisions corrected during review. `project_sources/` gate recorded against Prompt 3. |
