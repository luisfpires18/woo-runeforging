# Implementation status

**Last updated:** 3 August 2026
**Current stage:** Prompt 2 — simplified architecture and platform bootstrap ·
**implemented and reviewed**
**Next:** Prompt 3 — Foundations of Iron domain model · **unblocked**, awaiting
the product owner's instruction

Prompt 2 was implemented, reviewed by the product owner, and corrected on the
review's findings (§2.3). The change set is **uncommitted**, by instruction.

---

## 1. Scope of this change

Two things: **cut the architecture documentation back to what is being built**,
and **build the smallest working empty platform**.

### 1.1 Why the documentation was cut

The planning documents were replaced. Diffing the committed copies against the
new ones shows the product source of truth deliberately shrank the technical
baseline:

| Prompt 1 built to this | The new documents say |
|---|---|
| API plus a separate .NET worker | One application; background work stays in-process until measured need |
| Durable jobs, leases, retries, transactional outbox | Not mentioned; elapsed time resolved from stored timestamps |
| S3-compatible object storage and an asset manifest | Art stored with the application; a manifest "when the library needs one" |
| PixiJS from the start | "Added when the first battle replay genuinely needs it" |
| ~18 modules named up front | 6 feature folders, for the first slice only |
| Azure Container Apps topology as a deliverable | Deployment deferred until a local playable slice exists |

The Prompt 1 commit (`5142962`) encoded the older, larger baseline: a 1,391-line
`ARCHITECTURE.md` specifying a worker, `app.due_job` with `SKIP LOCKED` leases,
an outbox, Azurite, six PostgreSQL schemas, a full Azure and Bicep topology, an
OpenTelemetry metric catalogue, a 30-row invariant register, and a TypeScript
7 + 6 dual-compiler alias pair.

**None of it had been built**, so nothing was rolled back. What changed is the
documentation and the decision record.

### 1.2 Delivered

**Documentation**

- `docs/architecture/ARCHITECTURE.md` rewritten — 1,391 → 288 lines
- `docs/architecture/SLICES.md` trimmed to Prompts 2–8 — 309 → 103 lines
- `docs/adr/0001`–`0010` marked **Superseded**, bodies left unedited as the
  record of what was over-designed
- `docs/adr/0011`–`0014` written: platform shape, frontend stack, persistence,
  local development and CI
- `docs/adr/README.md` rewritten — current decisions, superseded decisions,
  revisit thresholds
- `docs/operations/` **deleted** (`RUNBOOK.md`, `RESTORE.md`, `COST.md`) —
  procedures for infrastructure that will not exist for many prompts
- `AGENTS.md` §1, §4, §7, §8 updated
- `README.md` created with the exact local start commands

**Platform**

- `global.json` (SDK 10.0.200), `Directory.Build.props`,
  `Directory.Packages.props`, `Woo.slnx`, `.nvmrc`
- `src/Woo.Api` — one ASP.NET Core 10 application; `Features/Health/`,
  `Features/Platform/`, `Persistence/WooDbContext.cs`
- `tests/Woo.Tests` — one test project, xunit.v3, 6 tests
- `web/` — React 19, Vite 8, **one** `typescript@6.0.3`
- `docker/docker-compose.yml` — PostgreSQL only, plus `docker/.env.example`
- `.github/workflows/validate.yml` — backend, frontend and docs jobs, on `master`

### 1.3 Deliberately not delivered

Gameplay · lore data · authentication · a separate worker · background-job
infrastructure · a transactional outbox · object storage or Azurite · PixiJS ·
Redis or a message broker · a second `DbContext` or per-feature schemas ·
OpenTelemetry · architecture-test frameworks · Azure resources · Bicep ·
deployment or image-publishing workflows · Kubernetes · microservices.

Also not delivered, on the product owner's instruction: **an initial EF Core
migration**. The first migration is created in Prompt 3 with the first real
tables.

---

## 2. Decisions made

| # | Decision | ADR |
|---|---|---|
| 1 | One ASP.NET Core application with feature folders; no worker, no jobs, no outbox, no architecture tests; `/api/v1` retained | [0011](../adr/0011-minimal-platform-shape.md) |
| 2 | React 19, Vite 8, **one** plain `typescript@6.0.3` | [0012](../adr/0012-frontend-stack.md) |
| 3 | PostgreSQL 18, one `WooDbContext`, default schema, no entities yet, elapsed time as stored timestamps | [0013](../adr/0013-persistence.md) |
| 4 | Compose for PostgreSQL only on host port 5433; CI on `master` for build, test, lint and type-check; no deployment | [0014](../adr/0014-local-development-and-ci.md) |

### 2.1 The dual TypeScript compiler was never necessary

ADR-0002 installed two compilers under aliases because `typescript-eslint`
resolves the bare specifier `typescript` and TypeScript 7 ships without the
programmatic API it needs. The premise was right; the conclusion was not.
Registry queries run for this prompt:

```
$ npm view typescript versions        → … "6.0.2", "6.0.3", "7.0.1-rc", "7.0.2"
$ npm view typescript@6.0.3 bin       → { tsc: 'bin/tsc', tsserver: 'bin/tsserver' }
$ npm view typescript-eslint peerDependencies
  { eslint: '^8.57.0 || ^9.0.0 || ^10.0.0', typescript: '>=4.8.4 <6.1.0' }
```

**`typescript@6.0.3` is published under the plain package name.** One install
satisfies `typescript-eslint`, provides `tsc`, and needs no explanation. The
alias pair, the `@typescript/typescript6` compat package, the `tsc6` binary and
the documented `@typescript/native` 404 are all gone.

### 2.2 Two corrections found by running things

**PostgreSQL 18 changed the container data directory.** Mounting
`/var/lib/postgresql/data` makes `postgres:18-alpine` refuse to start —
18+ images expect a single mount at `/var/lib/postgresql` and place the cluster
in a major-version subdirectory. The container reported `unhealthy` until the
mount was corrected.

**A native PostgreSQL service shadowed the container.** After the mount fix the
container was healthy, `psql` worked inside it, the host port was reachable, and
.NET still failed with `28P01: password authentication failed for user "woo"`.
The cause: `postgresql-x64-18` is installed and running on this machine and owns
port 5432, so the Docker mapping was shadowed and Npgsql was authenticating
against the wrong server. **The project now publishes host port 5433**
(`POSTGRES_PORT` overrides), which leaves the existing installation untouched.
Both the diagnosis and the resolution are in
[ADR-0014](../adr/0014-local-development-and-ci.md).

### 2.3 Corrections applied after review

The product owner reviewed the first implementation and required four
corrections before acceptance. All are applied.

| # | Finding | Correction |
|---|---|---|
| 1 | CI triggered on `main`; the repository's default branch is `master` | `validate.yml` now runs on push and pull request against **`master`**. Every branch-name reference to `main` in the documentation was corrected, including the superseded ADR-0010 |
| 2 | The `.env` documentation implied it configured the application | Rewritten. `.env` configures **Docker Compose only**; the backend never reads it and no dotenv package is installed. Changing the container's port or password requires setting `ConnectionStrings__Woo` explicitly for the API, which is now documented as a two-step change |
| 3 | Status did not record that the prompt had been reviewed | This document now states implemented **and reviewed** |
| 4 | `project_sources/` absent | **Supplied by the product owner.** 12 canon Markdown files verified present and unchanged; the Prompt 3 gate is now **READY** (§5.1) |

Correction 2 uncovered a further defect. **`.env.example` was at the repository
root, where Compose never reads it.** Compose resolves `.env` from the directory
containing the compose file, so the template was inert. Verified:

```
$ printf 'POSTGRES_PORT=15999\n' > .env
$ docker compose -f docker/docker-compose.yml config | grep published
        published: "5433"          # root .env ignored

$ printf 'POSTGRES_PORT=15999\n' > docker/.env
$ docker compose -f docker/docker-compose.yml config | grep published
        published: "15999"         # docker/.env honoured
```

The template moved to **`docker/.env.example`**. `.gitignore` was confirmed to
still ignore `docker/.env` while allowing `docker/.env.example`
(`git check-ignore -v docker/.env` → `.gitignore:46:.env docker/.env`).

---

## 3. Validation actually run

All commands executed on 3 August 2026 on Windows 11. Output recorded as
returned.

### 3.1 Toolchain

```
$ dotnet --list-sdks
9.0.301 / 10.0.100 / 10.0.200 [C:\Program Files\dotnet\sdk]

$ dotnet --list-runtimes
Microsoft.AspNetCore.App 8.0.17 / 9.0.6 / 10.0.0 / 10.0.4
Microsoft.NETCore.App    8.0.17 / 9.0.6 / 10.0.0 / 10.0.4

$ node --version && npm --version
v22.18.0
10.9.3

$ docker --version && docker compose version
Docker version 28.5.1, build e180ab8
Docker Compose version v2.40.3-desktop.1
```

Node 22.18.0 satisfies Vite 8's `>=22.12`, so `.nvmrc` pins **22** and no
upgrade is required. The Prompt 1 "upgrade to Node 24 before Prompt 2" action
item is withdrawn.

### 3.2 Database

```
$ docker compose -f docker/docker-compose.yml up -d
 Container woo-db  Started

$ docker compose -f docker/docker-compose.yml ps
NAME     IMAGE                STATUS                   PORTS
woo-db   postgres:18-alpine   Up 7 seconds (healthy)   0.0.0.0:5433->5432/tcp
```

### 3.3 Backend

```
$ dotnet restore
  Restored src\Woo.Api\Woo.Api.csproj (in 3.71 sec).
  Restored tests\Woo.Tests\Woo.Tests.csproj (in 5.63 sec).

$ dotnet format --verify-no-changes
(no output, exit code 0)

$ dotnet build -c Release
Build succeeded.
    0 Warning(s)
    0 Error(s)

$ dotnet test -c Release --no-build
Passed!  - Failed: 0, Passed: 6, Skipped: 0, Total: 6, Duration: 710 ms
```

The six tests: platform status shape · platform status omits the server version
· unknown route returns 404 · `/health` reports Healthy · the context can open a
connection to PostgreSQL · the context declares no entities.

### 3.4 Endpoints

```
$ curl -i http://localhost:5080/health
HTTP/1.1 200 OK
{"status":"Healthy","totalDurationMs":21.3,
 "checks":[{"name":"postgresql","status":"Healthy","description":null}]}

$ curl -i http://localhost:5080/api/v1/platform/status
HTTP/1.1 200 OK
{"application":"Weapons of Chaos and Order","environment":"Development",
 "utcNow":"2026-08-03T08:42:03.2272459+00:00","database":{"connected":true}}
```

Structured console logging, first line as emitted:

```
{"Timestamp":"2026-08-03T08:42:01.308Z","EventId":14,"LogLevel":"Information",
 "Category":"Microsoft.Hosting.Lifetime","Message":"Now listening on: http://localhost:5080",
 "State":{"address":"http://localhost:5080","{OriginalFormat}":"Now listening on: {address}"},
 "Scopes":[]}
```

### 3.5 Frontend

```
$ npm install
added 156 packages, and audited 157 packages in 16s
found 0 vulnerabilities

$ ls node_modules | grep ^typescript
typescript
typescript-eslint
$ ls node_modules/@typescript
(no such directory)
$ npx tsc --version
Version 6.0.3

$ npm run typecheck
(no output, exit code 0)

$ npm run lint
(no output, exit code 0)

$ npm run build
vite v8.2.0 building client environment for production...
✓ 17 modules transformed.
dist/index.html                   0.41 kB │ gzip:  0.27 kB
dist/assets/index-BwxD9mwE.css    1.12 kB │ gzip:  0.51 kB
dist/assets/index-D_ATu7vx.js   192.35 kB │ gzip: 60.67 kB
✓ built in 156ms
```

### 3.6 End-to-end round trip

With the API and `npm run dev` both running, the request the browser makes was
issued through the Vite proxy:

```
$ curl -i http://localhost:5173/api/v1/platform/status
HTTP/1.1 200 OK
server: Kestrel
{"application":"Weapons of Chaos and Order","environment":"Development",
 "utcNow":"2026-08-03T08:42:12.6711762+00:00","database":{"connected":true}}
```

`server: Kestrel` confirms the response came from the backend through the proxy
rather than from Vite.

---

## 4. What was NOT run, and why

| Not run | Reason |
|---|---|
| **The page loaded in a real browser** | Not executed. The proxied request was verified with `curl`, and the component renders that response, but **no human or automated browser check was performed.** This is the one acceptance criterion resting on inference |
| CI workflow | Nothing is committed or pushed; `validate.yml` has never executed |
| Frontend tests | No test runner exists — Prompt 5 |
| EF Core migrations | None exist — Prompt 3 |
| Content validation | No content or validator — Prompt 3 |
| gitleaks | Out of Prompt 2's stated CI scope |
| Mermaid diagram rendering | No renderer in the toolchain. The one diagram in `ARCHITECTURE.md` is written to documented syntax but has not been visually verified |
| Any deployment | Nothing is deployed, and it is not authorised |

---

## 5. Gates and blockers

### 5.1 `project_sources/` — **CLOSED**

**Status: READY** as of 3 August 2026. The gate that blocked Prompt 3 through
Prompts 1 and 2 is satisfied: `project_sources/` holds **exactly 12 Markdown
files**, supplied by the product owner and unchanged.

| File | Lines | Bytes | Subject |
|---|---:|---:|---|
| `arkazia.md` | 65 | 2,045 | Kingdom |
| `aura_levels.md` | 452 | 34,167 | L0 Dormant → L3; Conduit, Aspect, Dreadform, Ascendant |
| `draxys.md` | 64 | 1,931 | Kingdom |
| `lumus.md` | 62 | 2,061 | Kingdom |
| `my_lore_inspirations.md` | 23 | 298 | Creator's inspiration notes |
| `nordalh.md` | 60 | 1,788 | Kingdom |
| `rune_list.md` | 242 | 11,017 | Rune families and identities |
| `runeforged_weapons.md` | 41 | 3,350 | Rune vessels and weapon progression |
| `sylvara.md` | 64 | 2,092 | Kingdom |
| `veridor.md` | 68 | 2,241 | Kingdom |
| `weapons_of_chaos_and_order.md` | 158 | 9,349 | Singular Chaos Weapons; Order counters |
| `zandres.md` | 64 | 2,099 | Kingdom |

Verified: 12 `.md` files, **no non-Markdown files**, none empty, none excluded
by `.gitignore`. The directory is untracked and will enter git with the review
commit.

The seven kingdoms, the Aura ladder, the rune catalogue and the Chaos/Order
material together cover what
[`AGENTS.md §6`](../../AGENTS.md#6-active-gates) names as Prompt 3's
canon-derived inputs: rune families, fusion compatibility, destructibility
policy, Aura metadata, kingdom definitions and named-material catalogues.

**Not yet done:** the files are **present, not read**. Prompt 2 does not touch
lore, so reading them was out of scope. **Prompt 3 must read all 12 completely
before authoring any domain contract or content schema.**

`docs/domain/GLOSSARY.md` is still written against the Workbase summaries and
remains incomplete on lore specifics. Reconciling it with the canon is Prompt 3
work.

### 5.2 Node.js — resolved

Prompt 1 recorded "upgrade to Node 24 before Prompt 2". Withdrawn: `.nvmrc`
pins 22, which is installed and satisfies every dependency.

### 5.3 Open canon conflicts

The nine Workbase §23 conflicts are recorded in
[`../domain/GLOSSARY.md`](../domain/GLOSSARY.md). **None was resolved by this
change set.** Two block Prompt 31.

---

## 6. Acceptance criteria

| # | Criterion | Result |
|---|---|---|
| 1 | A clean checkout starts PostgreSQL, the backend and the frontend from documented commands | **Met** — §3.2–3.5, commands as written in `README.md` |
| 2 | The frontend renders a structural shell and successfully calls the API | **Partly evidenced** — the proxied call returns 200 from Kestrel (§3.6) and the build succeeds; the rendered page has not been opened in a browser |
| 3 | The solution builds and the focused tests pass | **Met** — 6/6 passed |
| 4 | The frontend type-checks and lints | **Met** |
| 5 | CI runs the same core build and test commands | **Written for `master`, not executed** — nothing is pushed |
| 6 | No secrets committed | **Met** — only `docker/.env.example` and local Compose credentials; `.gitignore` covers `.env`, `appsettings.*.local.json`, `secrets.json`, key material |
| 7 | No gameplay or future infrastructure implemented | **Met** — no entities (asserted by a test), no lore, none of the banned infrastructure |
| 8 | Architecture docs no longer prescribe unused infrastructure | **Met** — §1.2 |
| 9 | One TypeScript compiler | **Met** — §3.5 |
| 10 | Local development needs no Azure or paid service | **Met** |

---

## 7. Assumptions and risks

| Item | Note |
|---|---|
| Host port 5433 | Chosen because a native PostgreSQL 18 service occupies 5432 on the development machine. `POSTGRES_PORT` in `docker/.env` moves the container, but the API needs `ConnectionStrings__Woo` set separately. CI publishes 5433 too, so one connection string works in both places |
| Compose and application configuration are separate on purpose | No dotenv package. The .NET configuration system already layers environment variables, and a second mechanism reading the same file would make it ambiguous which one wins |
| `Woo.slnx` | The modern solution format. `dotnet build`, `test` and `format` all resolved it correctly. Falls back to `.sln` if other tooling objects |
| `tests/.editorconfig` | Disables the repository's async-suffix naming rule for test methods, whose names read as sentences. Scoped to `tests/` only |
| Feature folders are not mechanically enforced | With two projects there is nothing an architecture test could prove. Review carries it; [ADR-0011](../adr/0011-minimal-platform-shape.md) names the trigger for reopening |
| Rune leakage prevention | No longer a compile-time guarantee. It holds because runes do not exist — no folder, no table, no content |
| CI is unverified | It will first run on the initial push. Expect to iterate once |

---

## 8. Readiness for Prompt 3

**Ready. The gate is closed and nothing blocks it.**

| Criterion | Status |
|---|---|
| Platform runs from a clean checkout | Yes |
| Backend, tests, lint, typecheck and build all green | Yes |
| PostgreSQL reachable from the application and from tests | Yes |
| Architecture documentation matches what exists | Yes |
| Decision record current and consistent | Yes — 0011–0014 accepted, 0001–0010 superseded |
| No secrets, no gameplay, no deferred infrastructure | Yes |
| `project_sources/` present | **Yes — 12 canon files, gate closed** |

**Prompt 3 will deliver:** the first entities and the first EF Core migration,
`Microsoft.EntityFrameworkCore.Design` and a `dotnet-ef` tool manifest, the
Houses/Settlements/Resources/Forge/Armies/Battles feature folders, and the
Foundations of Iron starter content.

**Prompt 3 must begin by reading all 12 canon files completely.** They are
present but unread; Prompt 2 had no reason to open them.

> **Do not begin Prompt 3 without the product owner's instruction.**

---

## 9. Change log

| Date | Prompt | Summary |
|---|---|---|
| 2026-08-01 | 1 | Repository initialised. Architecture package, 10 ADRs, glossary, operations docs, slice traceability, validation scripts. |
| 2026-08-03 | 2 | Architecture package simplified: ARCHITECTURE.md rewritten, SLICES.md trimmed, `docs/operations/` deleted, ADRs 0001–0010 superseded by 0011–0014. Platform bootstrapped: one ASP.NET Core application, one test project, React/Vite shell, Compose for PostgreSQL, CI. Dual TypeScript compiler removed. PostgreSQL 18 mount path and a port-5432 collision with a native service found and fixed. |
| 2026-08-03 | 2 (review) | Corrections applied: CI retargeted to `master`; `.env` documented as Compose-only and its template moved to `docker/.env.example` where Compose actually reads it; status recorded as reviewed. `project_sources/` supplied — 12 canon files verified, **Prompt 3 gate closed**. |
