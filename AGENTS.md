# Repository instructions — Weapons of Chaos and Order

This file is the standing contract for anyone, human or agent, working in this
repository. Read it before changing anything.

---

## 1. Source precedence

When two sources disagree, the higher entry wins.

1. **[`docs/Weapons_of_Chaos_and_Order_Game_Workbase.md`](docs/Weapons_of_Chaos_and_Order_Game_Workbase.md)**
   — the product source of truth. Defines the game, its progression, its risks
   and its guardrails.
2. **[`docs/Weapons_of_Chaos_and_Order_Agent_AI_Implementation_Prompts.md`](docs/Weapons_of_Chaos_and_Order_Agent_AI_Implementation_Prompts.md)**
   — the execution contract. Defines the prompt sequence, the gates and what
   each stage deliberately defers.
3. **[`project_sources/`](project_sources/)** — the underlying lore canon
   (kingdoms, Aura levels, runes, Runeforged Weapons, Chaos and Order Weapons).
   12 Markdown files, present since 3 August 2026. See §6.
4. **`docs/architecture/` and `docs/adr/`** — accepted technical decisions.
5. Existing code and configuration.

Repository instructions and existing code **constrain how** a product decision
is implemented. They never silently override **what** was decided. If code and
the Workbase conflict, raise it; do not quietly pick one.

---

## 2. Decision labels — preserve them

The Workbase labels every decision. These labels are load-bearing:

| Label | Meaning | How to treat it |
|---|---|---|
| **Locked** | Established by the creator or existing canon | Implement as stated. Changing it requires the product owner. |
| **Foundation** | The recommended design to build and test | Implement, but keep it revisable. Do not harden it into an assumption other code depends on. |
| **Open** | Unresolved | **Never turn into canon.** Represent as configuration, a nullable field, or a documented placeholder. |
| **Later** | Deliberately excluded from early stages | Do not build. Do not "prepare for" beyond what an accepted ADR requires. |

If an unresolved choice blocks progress, **prefer the reversible
representation** and document the assumption in `docs/implementation/STATUS.md`.

Ask for approval only when different answers require materially different
architecture, data, or irreversible work.

---

## 3. Product rules that constrain every change

- The game begins **medieval**: outpost, resources, construction, barracks,
  ordinary armies, ordinary weapons, steel progression.
- **Runeforging is the long-term centre**, introduced only after the grounded
  foundation is proven. Rune *invariants* live in the architecture from the
  start; rune *gameplay* does not.
- Secondary professions support settlement, army, access and trade. **Do not
  add rune variants to every profession.**
- The first border is **Arkazia versus Sylvara**. The first rune prototype is
  **one Fire Rune and one named weapon journey**.
- Do not build all seven kingdoms, many professions, naval combat, Technic
  Runes, L3 gameplay, microservices, real-time combat, blockchain, runtime AI
  art, or monetization unless the active prompt explicitly requests it.
- **Never monetize** forge odds, rune safety, combat power, or time pressure.

---

## 4. Engineering rules

**Authority and correctness**

- The server is authoritative for time, resources, construction, forge
  outcomes, rune outcomes, battles, rewards and world state.
- Keep domain logic independent of HTTP, UI, databases, rendering, wall clocks
  and runtime randomness.
- Simulations must be reproducible from explicit inputs, rules/content version
  and seed.
- Treat duplicate user submissions and process restarts as normal wherever they
  can affect valuable state.
- Commands moving gold, resources, equipment, runes, soldiers or results must be
  **transactional**. Add idempotency only to commands that can realistically be
  retried or duplicated.
- **One confirmed Runeforging attempt has one immutable outcome.** A retry never
  creates another roll.
- **Ledger every gold and goods movement.**
- Keep permanent and seasonal state separate.

**Structure**

- **One ASP.NET Core application and one PostgreSQL database.** Keep background
  work inside the application until measured need justifies a separate worker.
  Do not introduce distributed infrastructure without measured need and explicit
  approval.
- Organise by **feature folder** inside that application, not by technical
  layer. A feature owns its endpoints, handlers and persistence configuration in
  one directory.
- **Do not create a folder, table, service or abstraction before something uses
  it.** Future systems may influence naming; they do not get empty scaffolding.
- Prefer **stored timestamps resolved on read** over timers, schedulers or job
  rows for anything that takes game time.
- Anything whose failure must undo a decision belongs in the **same
  transaction** as that decision.
- See [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md)
  for what is deliberately deferred and the trigger for reintroducing it.

**Content and assets**

- Use Gold, Provisions, Timber, Stone, Ore and Workshop Supplies for ordinary
  play. Named materials appear only when they create a meaningful choice.
- Use equipment batches for companies, named objects for important wielders,
  and singular world state for unique runes and Chaos or Order Weapons.
- Store approved art with the application. An asset manifest or object storage
  is introduced only when the library needs one. Faction placeholders and
  heraldic tokens are the fallbacks. **Never use emoji as game art.**

**Delivery**

- Build responsive behaviour, accessibility, migrations and focused automated
  tests **with** each feature, not after it. Deeper observability arrives when
  there is a real environment to operate.
- **Never deploy, push, publish, purchase services, or rotate credentials
  without explicit authorization.**

---

## 5. Workflow

1. Restate the active prompt as a compact implementation plan.
2. Inspect before editing. Reuse accepted code; extend, do not recreate.
3. Implement the **smallest coherent solution** satisfying the current scope.
4. Run narrow tests first, then the relevant full suites, linters, type checks,
   builds, content validation and visual checks.
5. Update `docs/implementation/STATUS.md` with scope, decisions, files,
   commands, results, limitations and next-step readiness.
6. Update ADRs, domain documentation, schemas and diagrams when an accepted
   contract changes.

Finish every prompt with: outcome; important files changed; tests and
validation actually run with their results; acceptance-criteria checklist;
assumptions, risks and deferred work; and whether the repository is ready for
the next numbered prompt.

**Implement only the current prompt. Stop when it is done.**

> **Do not claim a test, build, migration, benchmark, deployment or visual
> check passed unless you ran it.**

---

## 6. Active gates

| Gate | Status | Blocks |
|---|---|---|
| **`project_sources/` present** | **READY** — 12 canon Markdown files are in the repository (3 August 2026) | Nothing. Prompt 3 may proceed once the product owner instructs it. |
| **`project_sources/` read** | **Open per task** — read them before touching lore | Any change involving lore, kingdoms, Aura, runes, Runeforged Weapons, Chaos Weapons or Order Weapons |

Prompt 3 defines rune families, fusion compatibility, destructibility policy,
Aura metadata, kingdom definitions and named-material catalogues. All of that
is canon-derived. **Do not author it from the Workbase summaries alone** — the
canon is now present, so there is no longer any excuse to.

The 12 files, unchanged as supplied:

| File | Subject |
|---|---|
| `arkazia.md`, `draxys.md`, `lumus.md`, `nordalh.md`, `sylvara.md`, `veridor.md`, `zandres.md` | The seven kingdoms |
| `aura_levels.md` | L0 Dormant through L3, Conduit, Aspect, Dreadform, Ascendant |
| `rune_list.md` | Rune families and identities |
| `runeforged_weapons.md` | Rune vessels and weapon progression |
| `weapons_of_chaos_and_order.md` | The singular Chaos Weapons and the Order counters |
| `my_lore_inspirations.md` | The creator's inspiration notes |

**These files are canon and are never edited to fit the code.** If canon and an
implementation disagree, raise it; do not quietly pick one. Contradictions
between canon files are tracked in Workbase §23 and
[`docs/domain/GLOSSARY.md`](docs/domain/GLOSSARY.md), not resolved unilaterally.

---

## 7. Validation commands

These are the commands CI runs. Run the same ones locally.

```bash
# Local database — start this first; the backend tests need it
docker compose -f docker/docker-compose.yml up -d

# .NET
dotnet tool restore          # dotnet-ef, for migrations
dotnet format --verify-no-changes
dotnet build -c Release
dotnet test

# Frontend (from web/)
npm ci
npm run lint             # typescript-eslint, type-aware
npm run typecheck        # tsc --noEmit, one TypeScript 6.0.3 install
npm run build

# Documentation
bash scripts/check-adrs.sh
bash scripts/check-doc-links.sh
```

Every command above is runnable today and is what
[`.github/workflows/validate.yml`](.github/workflows/validate.yml) runs. A
command is added to this list in the same change that makes it runnable — never
before.

There is no frontend test runner and no content validator yet. They arrive with
the code they would validate (Prompts 5 and 3).

---

## 8. Current stage

**Prompt 3 (first domain model) is complete, uncommitted, awaiting review.**

| Prompt | Commit | Contents |
|---|---|---|
| 2 | `c1b3c98` | Platform bootstrap and the simplified architecture package |
| 2 | `a1067a7` | Review corrections and the 12 canon files |
| 3 | *uncommitted* | First domain model, starter content, first migration |

The repository holds one ASP.NET Core application with `Houses`, `Settlements`
and `Resources` feature folders; a static C# starter-content catalogue; the
House aggregate persisted through the `InitialHouseAggregate` migration; one
test project (29 tests); a React/Vite shell; Docker Compose for PostgreSQL; CI;
and the 12 canon files in [`project_sources/`](project_sources/).

There is **no forge, no army, no battle, no rune, no authentication, no API
surface over the domain, and no deployed infrastructure.**

**Prompt 3 was deliberately narrowed by the product owner** — smith, forge
capability, equipment batches, companies and battle contracts were deferred to
the prompts that mock and then build them, along with four of the prompt's six
rules. See [`docs/implementation/STATUS.md §0.1`](docs/implementation/STATUS.md).

Next: **Prompt 4 — Foundations of Iron UX and visual design.** A design package,
not code. Do not begin it without the product owner's instruction.
