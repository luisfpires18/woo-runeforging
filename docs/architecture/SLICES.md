# Slice traceability

Where each prompt's deliverables land. Read alongside
[`ARCHITECTURE.md`](ARCHITECTURE.md).

> **Scope of this document.** It covers Prompts 2–8 — the platform and the
> mocked Foundations of Iron slice. Prompts 9 onward are described in
> [`../Weapons_of_Chaos_and_Order_Agent_AI_Implementation_Prompts.md`](../Weapons_of_Chaos_and_Order_Agent_AI_Implementation_Prompts.md)
> and get rows here as they approach. The Prompt 1 version of this file mapped
> all thirty-two prompts onto modules, schemas and invariant identifiers that
> did not exist; predicting a Prompt 27 deliverable's home before the first
> table exists is a guess written in the register of a decision.

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

### Prompt 3 — House, outpost, buildings and resources · **complete**

The 12 canon files in [`../../project_sources/`](../../project_sources/) arrived
on 3 August 2026 and were read in full for this prompt.

**Delivered — one Arkazian House establishes an outpost, constructs buildings,
and manages resources:**

| Deliverable | Lands in |
|---|---|
| One House and one Outpost settlement | `Features/Houses/`, `Features/Settlements/` |
| The six universal resources, with the spend rule | `Features/Resources/` |
| The first buildings and construction state | `Features/Settlements/` |
| Arkazian starter content | `Content/` |
| **The first EF Core entities and the `InitialHouseAggregate` migration** | `Persistence/` |

Plain C# types with EF configuration kept separate; a static C# content
catalogue; focused tests.

**Deliberately narrowed by the product owner.** The prompt also lists a smith
and forge capability, an iron sword batch, a company with its equipment, and a
battle input/result contract. Those models are the ones the mocked playtests are
most likely to reshape, so they were deferred rather than guessed at:

| Deferred | Returns at |
|---|---|
| Smith, forge capability, crafts, equipment batches, weapon patterns | Prompt 12 · mocked at Prompt 6 |
| Companies, equipment slots, army archetypes | Prompt 13 · mocked at Prompt 7 |
| Battle input, result and application | Prompts 14–15 · mocked at Prompt 7 |
| Sylvaran opponent content | With the first battle |

**Rules.** The prompt lists six. Two are implemented and tested — *resources
cannot be spent below zero*, *a construction cannot complete twice*. Four are
deferred with the models they govern: *a craft cannot complete twice*, *one
batch has one current destination*, *a batch cannot be equipped and sold at
once*, *battle results cannot be applied twice*.

**No runes, markets, Orders, Warfronts, seasons, settlement tiers beyond Outpost,
or further kingdoms.** `Kingdom` and `SettlementStage` each have one member
rather than listing what canon describes but no prompt has built.

---

## Phase B — Model and mock Foundations of Iron

### Prompt 4 — UX and visual design · **complete**

A design package, no code. Seven documents in
[`../design/`](../design/): journeys, navigation, wireframes for six screens on
both viewports, the visual language with computed contrast ratios, the component
and state inventory, and the accessibility requirements.

**Decisions it makes so Prompt 5 does not have to:** the first useful action
(raise the Lumber Yard — a starter-balance hypothesis, not canon); four domain
accents each paired with a non-colour cue; a single dark theme; the mobile
two-tap rule; and where a primary action belongs, including the states that
correctly have none.

`accent-sylvara` is **reserved for future Sylvaran content** and used nowhere.
The package assigns Sylvara no role or relationship — no source it works from
establishes one.

### Prompt 5 — Mock House Seat and outpost onboarding · **complete**

The first player-facing screen, from typed fake data. House Seat with
first-session and returning shapes, settlement view with all seven buildings, the
six resources, a named smith, and the seven states.

**The adapter seam** (`web/src/api/`) is the deliverable that matters most:
components consume `HouseState` through a provider and cannot reach a fixture —
ESLint forbids it — so Prompts 10–17 replace fake state by writing a second
`HouseStateSource`, not by rewriting components.

Two design-package amendments came out of it: the site holds **seven** buildings
(Barracks and Forge previewed), and the mobile resource bar keeps its labels
rather than collapsing to bare numbers.

**Not built:** the construction commit flow — reserving resources, resolving
shortages and confirming — which is Prompt 6.

| Prompt | Deliverable | Lands in |
|---|---|---|
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
