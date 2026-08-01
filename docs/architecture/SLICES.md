# Slice traceability

Every numbered prompt mapped to the modules, schemas and contracts it lands in.
The purpose is to prove that **the architecture has no gap** — that each
deliverable from Prompt 2 to Prompt 29 has a defined home, and that nothing in
the sequence requires a schema redesign partway through.

Read alongside [`ARCHITECTURE.md`](ARCHITECTURE.md). Module tiers are defined in
[§4.4](ARCHITECTURE.md#44-module-tiers).

---

## Gate structure

| Gate | After | Decision |
|---|---:|---|
| Architecture | 1 | Can a small team build, test and operate the whole progression safely? |
| Platform | 3 | Are repository, modules, schemas and dependency rules ready for gameplay? |
| Foundations of Iron — mock | 8 | Is the grounded outpost-to-armed-company experience understandable and attractive? |
| Foundations of Iron — real | 18 | Does the authoritative medieval loop survive persistence and remain enjoyable? |
| First Flame | 24 | Is Runeforging understandable, tense, fair and strong enough to define the game? |
| Closed multiplayer | 29 | Do 20 players create useful trade, forging and conflict without burnout or instability? |

**A failed gate is not repaired by adding content.** Diagnose and fix the loop.

---

## Phase A — Architecture and engineering foundation

### Prompt 2 — Architecture package and repository bootstrap

| Deliverable | Lands in |
|---|---|
| ARCHITECTURE.md, ADRs, GLOSSARY.md, STATUS.md | `docs/` — **delivered by Prompt 1** |
| Repository tree | Solution layout, [§4.1](ARCHITECTURE.md#41-assembly-layers) |
| **Architecture tests enforcing dependency direction** | `tests/Woo.Architecture.Tests` |
| React/TypeScript/Vite web shell | `web/` |
| API health endpoints | `Woo.Api`, [§14.3](ARCHITECTURE.md#143-health-checks) |
| Worker heartbeat and graceful shutdown | `Woo.Worker`, [§7.1](ARCHITECTURE.md#71-due-jobs) |
| PostgreSQL, local object storage | Compose `db`, `blob` (Azurite) |
| Configuration validation | Options pattern with `ValidateOnStart()`, [§14.1](ARCHITECTURE.md#141-configuration-and-secrets) |
| Structured logs, OpenTelemetry-ready | [§14.2](ARCHITECTURE.md#142-logging-metrics-and-tracing) |
| Format, lint, typecheck, tests, CI | [ADR-0010](../adr/0010-environments-delivery-and-cost.md) |

**Architecture tests established here** and enforced for the rest of the project:
Runes unreferenced by tiers 0–3 · `Woo.Simulation` purity · banned APIs · no
module reaching another's internals · House-scoped queries taking `HouseId` from
`ActorContext`.

### Prompt 3 — Domain language, invariants and versioned content schemas

> **Blocked on `project_sources/`.** Rune families, fusion compatibility,
> destructibility policy, Aura metadata, kingdom definitions and named-material
> catalogues are canon-derived.

| Contract | Module | Schema |
|---|---|---|
| House, settlement | Houses, Settlements | `core` |
| Building, construction project | Construction | `core` |
| Workforce, specialist, capacity | Workforce, Specialists | `core` |
| Six resources, strategic materials, storage, reservations, ledgers | Resources | `economy` |
| Forge, smith, technique, pattern, **`ForgeCraft`**, named weapon, equipment batch | Forge, Equipment | `forge` |
| **Rune, Runestone, custody, appraisal, `RuneforgingAttempt`, weapon level** | **Runes (tier 4)** | `forge` |
| Company, battalion, loadout, deployment, battle, replay | Armies, Battles | `military` |
| Contract, market order, trade route, caravan | Contracts, Markets | `economy` |
| Situation, world state | Situations | `world` |
| Order, Warfront, permanent history, seasonal state | Orders, Warfronts, History | `world` |

Content schemas: kingdoms, regions, settlement stages, buildings, production
rules · resources and material families · patterns, grades, techniques, batch
rules, named vessels · company and battalion archetypes · terrain and battle
rules · **rune families, rarity, fusion compatibility, destructibility policy,
Aura metadata** · contracts and Situations · asset keys and fallbacks.

Seeded minimally: Arkazia and Sylvara. **A disabled Fire Rune definition for
schema validation only.**

**Invariants delivered:** I-04, I-05, I-08, I-09, I-10, I-19, I-21, I-22, I-24,
I-25 ([§15](ARCHITECTURE.md#15-critical-invariants-register)).

---

## Phase B — Model and mock Foundations of Iron

### Prompt 4 — Deterministic economy simulation

| Deliverable | Lands in |
|---|---|
| Headless simulation of 100+ Houses | `tools/Woo.Sim.Cli` |
| Deterministic seed and clock | `IClock`, `Pcg32` — [§5](ARCHITECTURE.md#5-determinism-clocks-randomness-battle-and-replay) |
| All values from versioned configuration | `Woo.Content` |
| Reproducible manifest, machine-readable results | CLI output contract |
| Conservation and ledger invariants | Same reconciliation query as production |

**No API, no database, no UI.** The simulation library and content loader only.

### Prompts 5–7 — Mocked House Seat, forging loop, battle and replay

| Prompt | Deliverable | Lands in |
|---|---|---|
| 5 | House Seat, settlement view, six resources, first smith | `web/src/modules/{houses,settlements,resources}` |
| 5 | Typed adapters so fake state is replaceable without rewriting components | `web/src/api/` — the contract that makes Prompts 10–17 a swap, not a rewrite |
| 5 | Approved art via manifest, faction placeholders, heraldic fallback | Assets module, [§9](ARCHITECTURE.md#9-assets-and-object-storage) |
| 6 | Reserve resources, procure shortages, assign specialist, complete construction | `web/src/modules/construction` |
| 6 | Iron sword pattern, grade, technique, smith; cost, duration, **guaranteed quality floor** before confirming | `web/src/modules/forge` |
| 6 | **Exactly one destination** — equip, contract, sell, retain | Destination state machine (I-08, I-09) |
| 7 | Bastion company, recruitment, morale, equipment summary | `web/src/modules/armies` |
| 7 | Formation plan, mocked deterministic event log | `web/src/modules/battles` |
| 7 | **PixiJS replay** — pause, speed, timeline, reduced motion, fallback | `web/src/render/` — **PixiJS enters the repository here** |
| 7 | Post-battle report with decisive factors and maker provenance | Battle explanation contract |

**Rune exposure:** a restrained lore hint only. No rune inventory,
probabilities, Runeforging controls or Aura combat. The tier-4 boundary means
the Runes module is not even referenced.

### Prompt 8 — Foundations of Iron mocked gate

Audit and package the full mocked path. Playtest script, telemetry definitions,
defect severity rules, pass/revise/stop criteria. **Mark "Awaiting human
playtest" — automated tests do not prove the loop is enjoyable.**

---

## Phase C — The real Foundations of Iron loop

### Prompt 9 — Durable persistence, jobs, outbox, idempotency

**The foundation everything after it stands on.**

| Deliverable | Lands in | Invariant |
|---|---|---|
| Job states, due time, attempts, bounded leases, safe concurrent claims | `app.due_job`, [§7.1](ARCHITECTURE.md#71-due-jobs) | I-16, I-17 |
| **Idempotency keys for client commands and handlers** | `app.idempotency_key`, [§7.2](ARCHITECTURE.md#72-command-sealing-and-idempotency) | I-06 |
| Transactional outbox | `app.outbox`, `app.outbox_consumed` | I-30 |
| Retry with backoff, poison handling, operator visibility | `Woo.Infrastructure.Jobs` | — |
| Clock and test clock | `IClock` | I-02 |
| Cancellation rules and non-cancellable commit boundaries | Application layer | I-15 (prepares) |
| Graceful shutdown, expired-lease recovery | `Woo.Worker` | I-17 |
| Metrics: queue depth, overdue, retries, failures, outbox lag | [§14.2](ARCHITECTURE.md#142-logging-metrics-and-tracing) | — |

> **This is where one-outcome retry integrity becomes real** — as generic
> infrastructure, exercised by ordinary construction and crafting. By Prompt 21
> it is proven in production paths, which is why `RuneforgingAttempt` needs no
> new retry mechanism.

### Prompts 10–13 — Authoritative resources, settlement, forging, armies

| Prompt | Deliverable | Module / schema | Invariant |
|---|---|---|---|
| 10 | Six resources with balances and ledgers | Resources / `economy` | I-04 |
| 10 | **Elapsed-time production without per-House jobs** | `accrued_through_utc`, [§6.4](ARCHITECTURE.md#64-ledger-balances-and-reservations) | I-02 |
| 10 | Reservations, transparent procurement, transfer reasons, reconciliation | Resources | I-05, I-06 |
| 11 | Outpost stage: Hall, storehouse, production, barracks, forge, armoury, walls | Construction, Settlements / `core` | — |
| 11 | Content-driven prerequisites, costs, duration, slots, cancellation, completion jobs | Construction | I-01 |
| 11 | Future stages in content contracts and documentation **only** | Content | — |
| 12 | **`ForgeCraft`** — patterns, grades, techniques, smith skill, forge capacity | Forge / `forge` | — |
| 12 | Transparent duration and **guaranteed minimum quality** | Forge — no probability model | — |
| 12 | 100-sword batches with maker mark, inputs, rules version, provenance | Equipment / `forge` | I-10 |
| 12 | **One exclusive destination command** | Destination state machine | I-08, I-09 |
| 13 | Company model, officers, morale, fatigue, wounds, veterancy | Armies / `military` | — |
| 13 | Batch-scale equipment slots, partial equipment rules | Armies, Equipment | I-11 |
| 13 | Casualty and equipment outcome states, repair and recovery hooks | Armies | — |

### Prompts 14–15 — Battle simulation and consequences

| Prompt | Deliverable | Lands in | Invariant |
|---|---|---|---|
| 14 | **Pure simulation library** | `Woo.Simulation` | I-12 |
| 14 | Project-owned deterministic RNG, named streams | `Woo.Simulation.Random` | I-12 |
| 14 | Canonical result, versioned replay events, explanation, reconciliation | Battle contracts, [§5.3](ARCHITECTURE.md#53-battle-contracts) | I-12 |
| 14 | Golden, property, invariant, edge-case, benchmark tests | `tests/Woo.Simulation.Tests` | I-12 |
| 15 | Validated formation plans, **immutable input snapshots** | Battles / `military` | I-12 |
| 15 | Durable scheduled resolution, result and replay storage | `app.due_job`, `military.battle_result` | I-14 |
| 15 | **Idempotent application** of casualties, equipment, rewards, history | Application transaction | I-14 |
| 15 | Polling with backoff | [§11.1](ARCHITECTURE.md#111-polling) | — |
| 15 | PixiJS replay against the real event log | `web/src/render/` | I-13 |

### Prompts 16–17 — Economy and Situations

| Prompt | Deliverable | Module / schema |
|---|---|---|
| 16 | Arkazian quartermaster contract for sword batches | Contracts / `economy` |
| 16 | **Bounded NPC demand** — budget, stockpile, volume, deadline, world state | Contracts |
| 16 | Regional market: listing, escrow, fee, expiry, fulfilment, cancellation, delivery | Markets / `economy` |
| 16 | One controlled Sylvaran strategic-material dependency | Resources — strategic inventory |
| 17 | House Seat projections and offline reports | History, read models |
| 17 | Situation engine: entry conditions, checks, costs, risks, outcomes, chains, versioning, allow-listed actions | Situations / `world` |
| 17 | One grounded Situation — Lost Iron Convoy or a timber shortage | Content |

**No rune content in Prompt 17.**

### Prompt 18 — Foundations of Iron real gate

Harden and validate. Clean and upgrade migrations, restart survival,
reconciliation, content validation, projection rebuild. Deterministic demo seed
and reset command. Operator troubleshooting guide. **The product owner confirms
the real loop is clear and satisfying. Do not add steel or runes before the gate
decision.**

---

## Phase D — The bridge to First Flame

### Prompt 19 — Steel, named weapons, master smith

| Deliverable | Module / schema | Note |
|---|---|---|
| Advanced forge or furnace capability | Forge / `forge` | — |
| **Steel as a process and material grade**, not a seventh universal resource | Content grades | Preserves the six-resource rule |
| Master Weaponsmith progression from varied meaningful work | Specialists | Not crafting spam |
| **`NamedItem`** — provenance, condition, repair, scars, owner, history | Equipment / `forge` | **The aggregate reserved at Prompt 3** — I-10 |
| A regional Situation foreshadowing a Runestone | Situations, Content | Foreshadowing only |

**No runes yet. Iron does not become obsolete. Cultural weapon roles stay
useful.**

### Prompt 20 — Runestones, discovery, custody, vault

| Deliverable | Lands in | Invariant |
|---|---|---|
| **Configurable Runeforging risk model in the simulation tools first** | `tools/Woo.Sim.Cli`, `Woo.Simulation` | I-12 |
| Funnel scenarios: high-destruction, over-safe, underprepared, master smith, singular rune | CLI scenarios | — |
| One Fire Runestone, discovery through an authored chain | **Runes (tier 4)** / `forge` | I-20 |
| Custody, owner, location, condition, history; transactional transfer | Runes | I-20 |
| Appraisal by a qualified specialist | Runes, Specialists | — |
| Secure storage through the Vault | Settlements | — |
| **Destructibility and singularity policy fields** | `RuneInstance` — **reserved at Prompt 3** | I-19 |
| Disabled singular fixture proving ordinary destruction is rejected | Content, tests | I-19 |
| Restrained rune codex revealing only discovered knowledge | `web/src/modules/runes` | — |

**The Fire Rune has no combat power here, and L0 is not implemented.**
The risk model is **not connected to player commands** in this prompt.

### Prompts 21–23 — L0, L1, L2

| Prompt | Deliverable | Lands in | Invariant |
|---|---|---|---|
| 21 | Vessel Smith capability; named steel weapon → eligible vessel | Runes, Forge | — |
| 21 | Binders, catalysts, safeguards, forge configuration, assigned smith | Runes | — |
| 21 | **Transparent pre-attempt risk panel** — every probability visible | `web/src/modules/runes` | I-15 |
| 21 | Failure ladder: clean, scarred, rejection, fracture, catastrophe | `RuneforgingAttempt` | — |
| 21 | **One immutable attempt result under retry** | Idempotency sealing from Prompt 9 | I-15 |
| 21 | Persisted formula version, content version, probability snapshot, seed reference, consumed/surviving/damaged/destroyed | `forge.runeforging_attempt` | I-15, I-18 |
| 21 | L0 Dormant weapon on success — **no active Aura** | `WeaponLevel` — reserved at Prompt 3 | — |
| 22 | Assignment to a named officer; weapon–wielder bond | Runes, Specialists | I-11 |
| 22 | Resonance with **anti-farming limits**; Fire-specific awakening deed | Runes | — |
| 22 | L1 awakening through the **same immutable risk engine** | Runes | I-15 |
| 22 | Restrained Fire Aura battle events and replay effects | `Woo.Simulation`, `web/src/render/` | I-12, I-13 |
| 23 | Accelerated L2 prototype: landmark deed, rare catalyst, Legendary Runeforger | Runes | — |
| 23 | L2 Artifact, staged 25/50/75/100 % Aspect metadata | Runes | — |
| 23 | **Singular-rune failure policy proven** — catastrophe redirects to vessel, specialist, dormancy, rejection, displacement or a follow-up Situation | Runes, Situations | **I-19, I-20** |

### Prompt 24 — First Flame gate

Audit the complete distinctive loop with separately seeded scenarios for clean
L0 success, rune-destroying failure, scarred success, L1 awakening, Artifact
attempt and singular-rune catastrophe. **Do not add multiplayer merely because
automated tests pass.**

---

## Phase E — Closed asynchronous multiplayer

| Prompt | Deliverable | Lands in | Invariant |
|---|---|---|---|
| 25 | Invited registration, login, renewal, recovery | Identity (tier 0) | — |
| 25 | **Server-side authorization for every House-owned command and read model** | `IAuthorizationPolicy` — **call sites exist from Prompt 2** | I-26 |
| 25 | Rate limiting, anti-forgery, audit, privacy export and deletion | `Woo.Api` | — |
| 25 | Onboarding: kingdom, House name, crest, motto, outpost, first smith | Houses, Settlements | — |
| 26 | Public, direct, kingdom, allied and Order-scoped crafting orders | Markets, Contracts | I-08 |
| 26 | Escrow, fees, deadlines, minimum quality, cancellation, delivery, dispute audit | Markets | I-04 |
| 26 | **Runeforging commission with a two-party immutable risk contract** | Runes, Markets | I-15 |
| 27 | Orders: membership, roles, activity feed, **ledgered warehouse**, shared objective | Orders / `world` | I-04 |
| 27 | **One seven-day Arkazia–Sylvara Warfront** with phases, objectives, contribution categories | Warfronts / `world` **seasonal** | I-24 |
| 27 | Permanent history versus temporary seasonal state | `world.season` + `season_id` | **I-24, I-25** |
| 28 | Telemetry across settlement, economy, equipment, runes, Warfront, jobs, onboarding | [§14.2](ARCHITECTURE.md#142-logging-metrics-and-tracing) | — |
| 28 | Support traces for House, ledger entry, batch, named weapon, rune, attempt, battle, order, contribution | Correlation ID chain | — |
| 28 | Security hardening; **migrations, backups and tested restore** | [`../operations/RESTORE.md`](../operations/RESTORE.md) | — |
| 28 | Cost-aware Azure manifests. **Do not deploy yet** | `infra/bicep/` | — |
| 29 | Deploy and run the 20-player closed gate | [`../operations/RUNBOOK.md`](../operations/RUNBOOK.md) | — |

---

## Phase F — Only after the closed gate succeeds

| Prompt | Deliverable | Note |
|---|---|---|
| 30 | Reusable season framework; **Sanguessuga** as a singular world object | Seasonal isolation (I-24) already in place from Prompt 3 |
| 31 | Cooperative Weapon of Order prototype | **Blocked** — requires the §23.4 living-anchor canon decision |
| 32 | One kingdom profession or system, added on evidence | Uses existing construction, job, ledger, contract, market, army, Situation, history, telemetry and asset contracts |

---

## Gap check

The architecture is complete for the sequence if every prompt's deliverables have
a home **and** no prompt requires changing a contract an earlier prompt depends
on. The three places that could have forced a redesign, and why they do not:

| Risk of redesign | Avoided by |
|---|---|
| Prompt 19 introduces named weapons after Prompt 12 built batches | `EquipmentBatch` and `NamedItem` are **separate aggregates from Prompt 3** with no conversion path (I-10) |
| Prompt 20–21 introduces runes and destructive risk after the medieval loop is live | `RuneInstance` with its destructibility policy and `WeaponLevel` exist from Prompt 3, disabled; `RuneforgingAttempt` is a new tier-4 aggregate, not a modification of `ForgeCraft` |
| Prompt 27 introduces seasonal state after permanent state is live | `world.season` and the **no-FK-permanent-to-seasonal** rule exist from Prompt 3 (I-24) |

The remaining known gap is not architectural:

> **`project_sources/` must be present before Prompt 3.** See
> [`../implementation/STATUS.md`](../implementation/STATUS.md).
