# Repository instructions — Weapons of Chaos and Order

This file is the standing contract for anyone, human or agent, working in this
repository. Read it before changing anything.

---

## 1. Source precedence

When two sources disagree, the higher entry wins.

1. **`Weapons_of_Chaos_and_Order_Game_Workbase.md`** — the product source of
   truth. Defines the game, its progression, its risks and its guardrails.
2. **`Weapons_of_Chaos_and_Order_Agent_AI_Implementation_Prompts.md`** — the
   execution contract. Defines the prompt sequence, the gates and what each
   stage deliberately defers.
3. **`project_sources/`** — the underlying lore canon (world, kingdoms, runes,
   weapons, characters). *Not yet present in the repository. See §6.*
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
- Treat concurrent requests, retries, worker restarts and duplicate delivery as
  normal operating conditions, not edge cases.
- Commands moving gold, resources, equipment, runes, soldiers or results must
  be **idempotent and transactional**.
- **One confirmed Runeforging attempt has one immutable outcome.** A retry never
  creates another roll.
- **Ledger every gold and goods movement.**
- Keep permanent and seasonal state separate.

**Structure**

- Prefer a **modular monolith and one worker process**. Do not introduce
  distributed infrastructure without measured need and explicit approval.
- Cross-module interaction follows one rule:
  > If a failure must undo the decision, it is a **synchronous call in the same
  > transaction**. If a failure only needs retrying later, it is an **outbox
  > event**.
- Modules depend downward through the tier graph in
  [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md).
  **Nothing in tiers 0–3 may reference the Runes module.**

**Content and assets**

- Use Gold, Provisions, Timber, Stone, Ore and Workshop Supplies for ordinary
  play. Named materials appear only when they create a meaningful choice.
- Use equipment batches for companies, named objects for important wielders,
  and singular world state for unique runes and Chaos or Order Weapons.
- Use approved art through the versioned asset manifest. Faction placeholders
  and heraldic tokens are the fallbacks. **Never use emoji as game art.**

**Delivery**

- Build responsive behaviour, accessibility, observability, migrations,
  reconciliation and automated tests **with** each feature, not after it.
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
| **`project_sources/` present and read** | **OPEN** — the directory does not exist in this repository | **Prompt 3** (domain contracts and versioned content schemas). Prompts 1 and 2 are unaffected. |

Prompt 3 defines rune families, fusion compatibility, destructibility policy,
Aura metadata, kingdom definitions and named-material catalogues. All of that
is canon-derived. Do not author it from the Workbase summaries alone.

---

## 7. Validation commands

These are the commands CI runs. Run the same ones locally.

```bash
# .NET
dotnet format --verify-no-changes
dotnet build -c Release
dotnet test

# Frontend (from web/)
npm ci
npm run typecheck        # TypeScript 7 via @typescript/native
npm run lint             # typescript-eslint via the TypeScript 6 compat package
npm run test
npm run build

# Content
dotnet run --project tools/Woo.Content.Validator

# Local stack
docker compose -f docker/docker-compose.yml up
```

Not all of these exist yet. A command is added to this list in the same change
that makes it runnable — never before.

---

## 8. Current stage

**Prompt 1 (architecture) is complete and approved.** The repository holds the
architecture package and ADRs only. There is no application code, no
`package.json`, no `.csproj` and no deployed infrastructure.

Next: **Prompt 2 — create the architecture package's platform counterpart and
bootstrap the empty repository.** Do not begin it without the product owner's
instruction.
