# Slice traceability

Where each prompt's deliverables land. Read alongside
[`ARCHITECTURE.md`](ARCHITECTURE.md).

> **Scope of this document.** It covers Prompts 2–8 — the platform and the
> mocked Foundations of Iron slice. Prompts 9 onward are described in
> [`../Weapons_of_Chaos_and_Order_Agent_AI_Implementation_Prompts.md`](../Weapons_of_Chaos_and_Order_Agent_AI_Implementation_Prompts.md)
> and get rows here as they approach. The Prompt 1 version of this file mapped
> all thirty-two prompts onto modules, schemas and invariant identifiers that
> did not exist; predicting a Prompt 27 deliverable's home before Prompt 3 has
> written a single table is a guess written in the register of a decision.

---

## Gate structure

| Gate | After | Decision |
|---|---:|---|
| Architecture | 1 | Can a small team build, test and operate the whole progression safely? |
| Platform | 3 | Are the repository, feature folders and first domain model ready for gameplay? |
| Foundations of Iron — mock | 8 | Is the grounded outpost-to-armed-company experience understandable and attractive? |
| Foundations of Iron — real | 18 | Does the authoritative medieval loop survive persistence and remain enjoyable? |
| First Flame | 24 | Is Runeforging understandable, tense, fair and strong enough to define the game? |
| Closed multiplayer | 29 | Do 20 players create useful trade, forging and conflict without burnout or instability? |

**A failed gate is not repaired by adding content.** Diagnose and fix the loop.

---

## Phase A — Platform

### Prompt 2 — Simplified architecture and repository bootstrap · **complete**

| Deliverable | Lands in |
|---|---|
| Simplified architecture package and ADRs 0011–0014 | [`ARCHITECTURE.md`](ARCHITECTURE.md), [`../adr/`](../adr/) |
| One ASP.NET Core application with feature folders | `src/Woo.Api/` |
| One `WooDbContext`, PostgreSQL connectivity | `src/Woo.Api/Persistence/` |
| `GET /health` | `src/Woo.Api/Features/Health/` |
| `GET /api/v1/platform/status` — the one endpoint the client calls | `src/Woo.Api/Features/Platform/` |
| React, TypeScript and Vite structural shell | `web/` |
| One automated test project | `tests/Woo.Tests/` |
| Docker Compose for PostgreSQL only | `docker/docker-compose.yml` |
| Build, test, lint and type-check CI | `.github/workflows/validate.yml` |
| Local start commands | [`../../README.md`](../../README.md) |

**Not delivered, deliberately:** gameplay, lore, authentication, a worker,
background jobs, an outbox, object storage, PixiJS, Redis, a broker, a second
`DbContext`, OpenTelemetry, architecture tests, Azure, deployment.

### Prompt 3 — Foundations of Iron domain model and starter content

> **Canon is present.** The 12 files in [`../../project_sources/`](../../project_sources/)
> arrived on 3 August 2026, closing the gate that blocked this prompt. Rune
> families, destructibility policy, kingdom definitions and named-material
> catalogues are canon-derived: **read all 12 before authoring any of them**,
> and do not fall back on Workbase summaries. See
> [`../implementation/STATUS.md §5.1`](../implementation/STATUS.md).

| Deliverable | Lands in |
|---|---|
| One House, one Outpost settlement | `Features/Houses/`, `Features/Settlements/` |
| The six universal resources | `Features/Resources/` |
| First buildings and construction state | `Features/Settlements/` |
| One named smith, basic forge capability | `Features/Forge/` |
| One iron sword equipment batch | `Features/Forge/` |
| One company and its equipment assignment | `Features/Armies/` |
| One local battle input and result contract | `Features/Battles/` |
| **The first EF Core entities and the first migration** | `Persistence/` |

Plain C# types and focused tests. EF Core persistence only where the next
playable action needs it. Minimum Arkazian and Sylvaran starter content.

**Rules this slice must enforce:** resources cannot be spent below zero; a
construction or craft cannot complete twice; one batch has one current
destination; a batch cannot be equipped and sold at once; battle results cannot
be applied twice.

**No runes, markets, Orders, Warfronts, seasons, settlement tiers or further
kingdoms** — only a short note on where they extend the model.

---

## Phase B — Model and mock Foundations of Iron

| Prompt | Deliverable | Lands in |
|---|---|---|
| 4 | UX and visual design package for the first playable experience | `docs/design/` |
| 5 | House Seat, settlement view, six resources, first smith — typed fake data | `web/src/` |
| 5 | Typed adapters so fake state is replaceable without rewriting components | `web/src/api/` |
| 6 | Reserve resources, resolve shortages, assign a specialist, complete construction | `web/src/` |
| 6 | Iron sword pattern, grade, technique, smith; cost, duration and guaranteed quality floor before confirming | `web/src/` |
| 6 | **Exactly one destination** — equip, contract, sell, retain | Destination state machine |
| 7 | Bastion company, recruitment, morale, equipment summary | `web/src/` |
| 7 | Formation plan and a mocked deterministic event log | `web/src/` |
| 7 | Battle replay — **PixiJS enters the repository here** | `web/src/` |
| 7 | Post-battle report with decisive factors and maker provenance | Battle explanation contract |
| 8 | Audit and package the full mocked path; playtest script and gate criteria | `docs/` |

**Rune exposure through Prompt 8: a restrained lore hint only.** No rune
inventory, probabilities, Runeforging controls or Aura combat.

Prompt 8 ends **"Awaiting human playtest"** — automated tests do not prove the
loop is enjoyable.
