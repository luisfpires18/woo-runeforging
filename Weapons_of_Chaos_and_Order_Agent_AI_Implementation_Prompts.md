# Weapons of Chaos and Order

## Agent AI Implementation Prompts v0.2

**Date:** 1 August 2026  
**Supersedes:** Agent AI Implementation Prompts v0.1  
**Product source:** Weapons_of_Chaos_and_Order_Game_Workbase_v0.2.md  
**Canon sources:** all Markdown files in project_sources/  
**Purpose:** A controlled prompt sequence for planning and implementing the medieval-first, forging-centred game without attempting the full persistent world at once.

---

# How to use this file

Give the implementation agent:

1. The Global Agent Contract.
2. Exactly one numbered prompt.
3. Any approval or correction produced by the previous gate.

Run the prompts in order. Do not execute multiple numbered prompts in one change set. Every prompt must stop with reviewable documentation, validation, and an explicit readiness statement.

Version 0.1 is historical context only. Version 0.2 controls implementation.

## Product gates

| Gate | Completed after | Required decision |
|---|---:|---|
| Architecture | Prompt 1 | Can a small team build, test, and operate the whole progression safely? |
| Platform | Prompt 3 | Are repository, modules, schemas, and dependency rules ready for gameplay? |
| Foundations of Iron mock | Prompt 8 | Is the grounded outpost-to-armed-company experience understandable and attractive? |
| Foundations of Iron real | Prompt 18 | Does the authoritative medieval loop survive persistence and remain enjoyable? |
| First Flame | Prompt 24 | Is Runeforging understandable, tense, fair, and strong enough to define the game? |
| Closed multiplayer | Prompt 29 | Do 20 players create useful trade, forging, and conflict without burnout or instability? |

Do not continue past a failed gate by adding more content. Diagnose and repair the failed loop first.

---

# Global Agent Contract

Prepend this contract to every numbered prompt.

~~~text
You are the implementation agent for Weapons of Chaos and Order.

Before changing anything:
1. Read Weapons_of_Chaos_and_Order_Game_Workbase_v0.2.md completely.
2. Read Weapons_of_Chaos_and_Order_Agent_AI_Implementation_Prompts_v0.2.md completely enough to understand the active prompt, its gate, and what later prompts deliberately defer.
3. Read every Markdown file in project_sources/ when the task touches lore, kingdoms, Aura, runes, Runeforged Weapons, Chaos Weapons, or Order Weapons.
4. Read repository instructions, architecture decision records, implementation status, and relevant code.
5. Inspect the working tree. Preserve unrelated user changes and extend accepted work instead of recreating it.

Source-of-truth rules:
- Preserve the labels Locked, Foundation, Open, and Later.
- Do not silently convert a Foundation or Open decision into canon.
- If an unresolved choice blocks implementation, prefer a reversible representation and document the assumption.
- Ask for approval only when different answers require materially different architecture, data, or irreversible work.
- The game begins medieval: outpost, resources, construction, barracks, ordinary armies, ordinary weapons, and steel progression.
- Runeforging is the defining long-term system, but it is introduced only after the grounded foundation.
- Secondary professions support settlement, army, access, and trade. Do not add rune variants to every profession.
- The first border is Arkazia versus Sylvara.
- The first rune prototype is one Fire Rune and one named weapon journey.
- Do not build all seven kingdoms, many professions, naval combat, Technic Runes, L3 gameplay, microservices, real-time combat, blockchain, runtime AI art, or monetization unless the active prompt explicitly requests it.

Engineering rules:
- Implement only the current prompt.
- Keep the server authoritative for time, resources, construction, forge outcomes, rune outcomes, battles, rewards, and world state.
- Keep domain logic independent from HTTP, UI, databases, rendering, wall clocks, and runtime randomness.
- Make simulations reproducible from explicit inputs, rules/content version, and seed.
- Treat concurrent requests, retries, worker restarts, and duplicate delivery as normal.
- Commands moving gold, resources, equipment, runes, soldiers, or results must be idempotent and transactional.
- One confirmed Runeforging attempt has one immutable outcome. A retry never creates another roll.
- Ledger every gold and goods movement.
- Keep permanent and seasonal state separate.
- Prefer a modular monolith and one worker process. Do not introduce distributed infrastructure without measured need and explicit approval.
- Use Gold, Provisions, Timber, Stone, Ore, and Workshop Supplies for ordinary play. Named materials appear only when they create a meaningful choice.
- Use equipment batches for companies, named objects for important wielders, and singular world state for unique runes and Chaos or Order Weapons.
- Use approved art through a versioned asset manifest. Faction placeholders and heraldic tokens are fallbacks.
- Build responsive behavior, accessibility, observability, migrations, reconciliation, and automated tests with each feature.
- Never deploy, push, publish, purchase services, or rotate credentials without explicit authorization.

Workflow:
1. Restate the active prompt as a compact implementation plan.
2. Inspect before editing and reuse accepted code.
3. Implement the smallest coherent solution satisfying the current scope.
4. Run narrow tests first, then relevant full tests, linters, type checks, builds, content validation, and visual checks.
5. Update docs/implementation/STATUS.md with scope, decisions, files, commands, results, limitations, and next-step readiness.
6. Update ADRs, domain documentation, schemas, and diagrams when an accepted contract changes.

Finish with:
- Outcome.
- Important files changed.
- Tests and validation actually run, with results.
- Acceptance criteria checklist.
- Assumptions, risks, and deferred work.
- Whether the repository is ready for the next numbered prompt.

Do not claim a test, build, migration, benchmark, deployment, or visual check passed unless you ran it.
Stop after the active prompt.
~~~

---

# Phase A: Architecture and engineering foundation

## Prompt 1: Tech stack and architecture

~~~text
Start in Plan mode. Act as the principal architect. Do not edit files, scaffold applications, install dependencies, or implement gameplay.

Read the v0.2 workbase, this prompt pack, all canon files, repository instructions, documentation, and existing code. Inspect the current working tree.

Design the architecture for a browser-first, mobile-friendly, persistent asynchronous strategy RPG that must support:
- one evolving settlement from outpost to regional capital;
- elapsed-time resource production and asynchronous construction;
- specialists, barracks, recruitment, equipment batches, and named items;
- ordinary forging, steel progression, and player commissions;
- rune discovery, custody, appraisal, and secure storage;
- deterministic, auditable Runeforging outcomes with destructive failures;
- immutable unique-rune and unique-weapon constraints;
- weapon resonance, deeds, L0, L1, and L2;
- deterministic battalion battle simulation and visual replay;
- contracts, regional markets, Orders, Warfronts, seasons, Situations, and history;
- approved art assets and content authoring;
- local play first and a later 20-player closed test.

Compare at least:
A. ASP.NET Core API, .NET Worker, React and TypeScript with Vite, PixiJS, and PostgreSQL.
B. Next.js and TypeScript with a separate durable worker and PostgreSQL.

Account for the project owner's strong C#/.NET experience, server-authoritative simulation, background work, deterministic risk systems, authenticated application-heavy UI, testability, operational simplicity, cost, and portability.

Unless repository evidence strongly favors another option, recommend:
- an ASP.NET Core modular monolith;
- a separate .NET worker using the same application and infrastructure contracts;
- React, TypeScript, Vite, and PixiJS;
- PostgreSQL;
- Docker Compose locally;
- an S3-compatible object-storage abstraction;
- Azure Container Apps, managed PostgreSQL, and Azure Blob Storage for student-credit environments.

Do not assume a paid premium service. The owner has Azure for Students. Include budgets, alerts, conservative resource sizes, scale-to-zero where technically appropriate, and a portable path to Docker Compose or a VPS. Verify supported stable framework versions from official documentation at implementation time rather than trusting stale version text.

Resolve and document:
- runtime units and source-of-truth boundaries;
- frontend routing, server state, local UI state, forms, validation, testing, and PixiJS integration;
- API style, versioning, optimistic concurrency, and polling;
- modular-monolith boundaries and dependency direction;
- PostgreSQL access, migrations, transactions, ledgers, reservations, and audit history;
- database-backed due jobs, leases, retries, idempotency, poison handling, and transactional outbox;
- deterministic clock and project-owned random abstractions;
- immutable probability snapshots and one-outcome Runeforging retries;
- battle input, result, explanation, event-log, and replay contracts;
- permanent versus seasonal data boundaries;
- versioned authored content, validation, publication, and migration;
- asset manifest, object storage, cache/version behavior, and fallbacks;
- authentication and authorization boundaries without implementing accounts;
- local development, CI, testing pyramid, observability, backups, restore, and deployment;
- when polling is sufficient and when push becomes justified;
- explicit reasons not to use microservices, Redis, Kubernetes, or a broker initially.

Propose modules at minimum for Houses, Settlements, Resources, Workforce, Specialists, Forge, Runes, Equipment, Armies, Battles, Contracts, Markets, Situations, Orders, Warfronts, History, Content, and Assets.

Create an implementation-ready architecture plan covering:
- proposed repository tree;
- context, container, component, and key-sequence diagrams;
- aggregate ownership and cross-module command/event rules;
- critical invariants;
- ADR package;
- migration and deployment strategy;
- exact validation and acceptance steps;
- technical risks mapped to product risks;
- the two product slices: Foundations of Iron and First Flame.

The architecture must model future rune invariants without exposing rune gameplay in the initial tutorial.

Stop with a concrete plan for approval. Do not create the architecture files until the plan is approved. Do not proceed to Prompt 2.
~~~

## Prompt 2: Create the architecture package and bootstrap the repository

~~~text
Implement only the approved Prompt 1 architecture and empty platform.

Create:
- docs/architecture/ARCHITECTURE.md with compact context, container, module, deployment, job, Runeforging-attempt, and battle-replay diagrams;
- accepted ADRs;
- docs/domain/GLOSSARY.md;
- docs/implementation/STATUS.md;
- the approved repository tree;
- architecture tests enforcing dependency direction.

Bootstrap the smallest working platform:
- React, TypeScript, and Vite web shell;
- ASP.NET Core API health endpoints;
- .NET worker heartbeat and graceful shutdown;
- PostgreSQL;
- local S3-compatible object storage;
- Docker Compose development environment;
- configuration validation;
- structured logs and OpenTelemetry-ready instrumentation;
- formatting, linting, type checking, unit tests, integration-test infrastructure, and CI.

Use one documented start command or a small explicit command set. Local work cannot require Azure or another paid service. Do not add game features, authentication, Redis, a broker, or Kubernetes.

Acceptance criteria:
- Clean checkout builds and tests.
- Web, API, worker, database, and local object storage start together.
- Liveness and dependency readiness are distinct.
- Worker restart and graceful shutdown are demonstrated.
- Domain and simulation projects have no UI, HTTP, database, or infrastructure dependency.
- CI uses the same core commands as local development.
- No secrets are committed.

Stop when the empty platform and documentation are healthy.
~~~

## Prompt 3: Domain language, invariants, and versioned content schemas

~~~text
Create the first executable domain contracts without implementing gameplay flows.

Define stable identifiers, lifecycle states, aggregate boundaries, ownership, domain events, and invariants for:
- House and settlement;
- building and construction project;
- workforce, specialist, and capacity;
- six universal resources, strategic materials, storage, reservations, and ledgers;
- forge, smith, technique, pattern, ordinary craft, named weapon, and equipment batch;
- rune, Runestone, rune custody, appraisal, Runeforging attempt, and weapon level;
- company, battalion, loadout, deployment, battle, and replay;
- contract, market order, trade route, and caravan;
- Situation and world state;
- Order, Warfront, permanent history, and seasonal state.

Create versioned content schemas for:
- kingdoms, regions, settlement stages, buildings, and production rules;
- resources and material families;
- weapon patterns, grades, techniques, batch rules, and named vessels;
- company and battalion archetypes;
- terrain and battle rules;
- rune families, rarity class, fusion compatibility, destructibility policy, and Aura metadata;
- contracts and Situations;
- art asset keys and fallbacks.

Seed only the minimum Arkazia and Sylvara definitions needed by later prompts. Add a disabled Fire Rune definition for schema validation only.

Required invariants:
- balances and reserved balances reconcile;
- the same object cannot occupy incompatible destinations;
- an equipment batch cannot be sold and equipped simultaneously;
- named and Runeforged weapons are never mass-produced batches;
- one final rune identity belongs to one Runeforged weapon;
- one confirmed Runeforging attempt has one result;
- a destructible rune cannot be consumed twice;
- a singular rune cannot use an ordinary destruction transition;
- battle results cannot be applied twice;
- permanent data cannot be deleted by a seasonal reset;
- all money and goods movements are ledgered.

Produce validators, documentation, diagrams, and tests. Invalid references, duplicate IDs, illegal state transitions, unsupported rune fusion, and missing asset fallback keys must fail clearly.

Do not implement commands, database repositories, UI, or complete content.

Acceptance criteria:
- Domain contracts run without database or web dependencies.
- Content is data-driven and versioned.
- Open canon decisions are explicit configuration or documented placeholders.
- The model supports batch equipment, named weapons, and singular runes without conflating them.
- Architecture tests preserve module direction.

Stop at the platform gate.
~~~

---

# Phase B: Model and mock Foundations of Iron

## Prompt 4: Deterministic medieval progression and economy simulation

~~~text
Build a headless deterministic simulation tool for the grounded medieval game before connecting real gameplay.

Simulate at least 100 Houses across accelerated outpost-to-town progression and repeated regional conflicts. Include:
- six universal resources;
- elapsed-time production;
- construction costs and capacity;
- barracks, recruitment, ordinary equipment demand, forge capacity, repair, and loss;
- Arkazian ore and stone abundance;
- Sylvaran timber and hide abundance;
- bounded kingdom and NPC demand;
- player-like trade decisions;
- iron-to-steel progression;
- gold faucets and sinks;
- low population and blocked-route behavior.

All values come from versioned configuration. Use explicit seed and clock. Export a reproducible manifest, machine-readable results, and a concise report.

Report:
- time to settlement milestones;
- resource bottlenecks and storage pressure;
- equipment produced, equipped, sold, damaged, repaired, and lost;
- novice and skilled smith profitability;
- prices, volume, shortages, oversupply, and concentration;
- gold created and removed;

Include baseline, low population, resource shortage, overproduction, high battle losses, market concentration, and blocked-route scenarios.

Do not tune to a desired result. Document unstable loops honestly.

Acceptance criteria:
- Same configuration and seed produce identical output.
- Every run can be reproduced from its manifest.
- Conservation and ledger invariants detect duplication.
- Low population remains playable without infinite NPC purchases.
- CI can run a small deterministic scenario quickly.
~~~

## Prompt 5: Mock House Seat and outpost onboarding

~~~text
Build the first polished player-facing mock with typed fake data only.

Create a responsive House Seat for a new minor Arkazian House near the Sylvaran border. The player must:
- understand that they control one evolving settlement;
- see Gold, Provisions, Timber, Stone, Ore, and Workshop Supplies;
- inspect the initial site and geography;
- assign or confirm basic production;
- build or preview the House Hall, storehouse, barracks, and forge;
- meet one named smith;
- understand what changed, what needs attention, and what advances the House.

The settlement view must visibly change when a building is completed. Use approved art through the asset manifest; otherwise use coherent faction placeholders and a heraldic fallback. Do not use emoji as game art.

Show only a restrained lore hint that runes exist. Do not expose rune inventory, probabilities, Runeforging buttons, or Aura combat.

Use typed adapters so the fake state can later be replaced without rewriting components. Add desktop and mobile states, loading, empty, missing-asset, error, construction, and completed states.

Acceptance criteria:
- A first-time tester can identify the next useful action without explanation.
- The view feels like a medieval outpost, not a generic dashboard.
- Settlement growth is visually legible.
- Essential decisions remain available on mobile.
- No production persistence, authentication, or multiplayer is introduced.
~~~

## Prompt 6: Mock ordinary construction and forging loop

~~~text
Implement the mocked Foundations of Iron economy loop.

The player must be able to:
- reserve resources for a barracks and basic forge;
- understand which resources are missing;
- procure ordinary shortages without manual gathering chores;
- assign a worker or specialist;
- complete mocked construction;
- inspect a kingdom request for 100 infantry swords;
- choose an iron sword pattern, material grade, one technique, and the named smith;
- see cost, duration, guaranteed quality floor, equipment effect, and destination before confirming;
- complete the craft;
- choose exactly one destination: equip the House company, fulfill the kingdom contract, list for sale, or retain.

Ordinary forging has no destructive hidden roll. Represent construction and crafting as explicit state machines. Prevent duplicate confirmation and conflicting destinations.

Instrument time to first building, first craft, abandon points, chosen technique, shortage resolution, and destination choice.

Acceptance criteria:
- The player understands why the swords are needed.
- The complete craft is a decision, not only a timer.
- The same batch never reaches two destinations.
- Costs and quality are understandable before confirmation.
- A new tester can complete the intended path within the playtest target.
~~~

## Prompt 7: Mock recruitment, equipment, local battle, and replay

~~~text
Complete the mocked medieval promise.

Create:
- one Arkazian Bastion company;
- recruitment, training, morale, and equipment summaries;
- assignment of the forged 100-sword batch;
- one simple formation plan;
- one mountain-forest local conflict against a Sylvaran force;
- a deterministic mocked battle event log;
- a PixiJS replay using representative soldiers, banners, projectiles, morale changes, and retreat;
- pause, speed, timeline, important-event, reduced-motion, and fallback rendering;
- a post-battle report with decisive factors, casualties, wounds, equipment damage, salvage, payment, and maker history;
- a repair or replacement choice.

Changing the sword destination must change battle readiness and outcome. The replay only visualizes the event log and never calculates combat.

Do not add runes, heroes, mounts, direct PvP, or large Warfront systems.

Acceptance criteria:
- Equipment visibly affects readiness and the report.
- The player can explain at least one decision they would change.
- Soldier and equipment outcomes reconcile in mock state.
- The replay remains legible on the agreed mobile baseline and with fallback sprites.
- Maker provenance reaches the battle history.
~~~

## Prompt 8: Foundations of Iron mocked gate

~~~text
Audit and package the complete mocked path without adding systems:

House Seat -> establish production -> build barracks and forge -> recruit Bastions -> forge 100 iron swords -> equip, sell, retain, or contract -> plan local defense -> replay battle -> inspect losses and repair -> return to the evolved settlement.

Remove dead ends, inconsistent state, inaccessible controls, misleading copy, and visual regressions. Run unit, component, end-to-end, build, type, lint, accessibility, and representative performance checks. Inspect desktop and mobile renders.

Create a human playtest package:
- first-session moderator script;
- two-minute return-session task;
- comprehension questions;
- telemetry definitions;
- defect severity rules;
- explicit pass, revise, and stop criteria;
- a decision sheet for the Foundations of Iron questions in the workbase.

Mark the gate Awaiting human playtest. Automated tests do not prove the loop is enjoyable.

Acceptance criteria:
- The full mock works without developer help.
- The player understands settlement, forging, destination, equipment, and consequence.
- The game feels grounded and medieval.
- No rune gameplay is accidentally exposed.
- Later backend systems are not required to run the test.

Stop for the product owner's gate decision.
~~~

---

# Phase C: Build the real Foundations of Iron loop

## Prompt 9: Durable persistence, due jobs, outbox, and idempotency

~~~text
After Prompt 8 is approved, implement the server foundation needed to replace mocks.

Use PostgreSQL for authoritative state and a database-backed due-job system for construction, production completion where required, training, crafting, travel, recovery, and battle resolution.

Implement:
- job states, due time, attempt history, bounded leases, and safe concurrent claims;
- idempotency keys for client commands and handlers;
- transactional outbox;
- retry with backoff, poison handling, and operator visibility;
- clock and test clock;
- cancellation rules and non-cancellable commit boundaries;
- graceful shutdown and expired-lease recovery;
- migration and rollback documentation;
- metrics for queue depth, overdue work, retries, failures, latency, and outbox lag.

Do not create one operating-system timer per task. Do not add Redis or a broker.

Prove with real PostgreSQL integration tests:
- duplicate command does not double-spend;
- two workers do not apply one job twice;
- process failure after commit but before notification is recovered;
- expired lease is reclaimed;
- offline elapsed time resolves correctly;
- applied battle or forge result cannot apply twice.

Acceptance criteria:
- Restarting API or worker loses no committed project.
- Duplicate delivery is safe.
- Time tests do not sleep.
- Domain modules remain infrastructure-independent.
~~~

## Prompt 10: Authoritative resources, storage, production, and procurement

~~~text
Replace fake resources with authoritative balances and ledgers.

Implement:
- Gold, Provisions, Timber, Stone, Ore, and Workshop Supplies;
- elapsed-time passive production without frequent per-House jobs;
- storage capacity and overflow behavior that does not require constant collection;
- reservations for construction, forging, trade, and recruitment;
- transparent automatic procurement for ordinary shortages;
- transfer reasons, actor, correlation ID, and transaction history;
- reconciliation between ledger totals, reservations, and current balances.

Seed only the Arkazian slice. Represent Sylvaran heartwood or hides as strategic named materials only where approved later.

Connect the resource and procurement UI to real endpoints. The server never trusts client prices, elapsed time, or balances.

Test accrual, caps, reservations, release, spend, procurement, insufficient balance, concurrent commands, and long absence.

Acceptance criteria:
- Every balance change is traceable.
- Passive production does not require one recurring task per House.
- The player can begin without clicking gathering nodes.
- Retry and concurrency cannot create value.
- Resource presentation remains simple.
~~~

## Prompt 11: Authoritative settlement and construction progression

~~~text
Implement the Outpost stage and only the buildings needed by Foundations of Iron:
- House Hall;
- storehouse;
- basic production sites;
- barracks;
- forge;
- armoury;
- simple walls or watch.

Create content-driven prerequisites, costs, duration, capacity changes, construction slots, cancellation boundaries, completion jobs, reports, and visual settlement-state projections.

Do not implement every settlement stage. Represent future Village, Fortified Town, Regional Capital, and Runic Seat in content contracts and documentation only.

Construction upgrades capability rather than adding long percentage ladders. Include worker or specialist reservation where it creates a real choice.

Connect the approved mock UX to real state. Test duplicate start, prerequisite failure, resource reservation, cancellation, worker conflict, completion retry, worker restart, and projection rebuild.

Acceptance criteria:
- The real settlement visibly evolves.
- Construction survives API and worker restarts.
- Resources and capacity reconcile.
- No building can complete twice.
- Future stages do not require schema redesign.
~~~

## Prompt 12: Authoritative ordinary forging and batch provenance

~~~text
Implement ordinary weapon-batch forging only.

Support:
- versioned patterns, material grades, and techniques;
- smith skill and availability;
- forge capacity;
- transparent duration and guaranteed minimum quality;
- resource reservation and consumption;
- queued, active, completed, cancelled, retained, listed, contracted, and equipped states as appropriate;
- 100-sword batches with quantity, quality, condition, maker mark, inputs, rules version, and provenance;
- completion jobs and durable reports;
- one exclusive destination command.

Persist enough information to explain an old batch after balance rules change.

Do not implement named weapons, steel, runes, destructive random rolls, Artifacts, or other professions.

Test quality floor, resource lifecycle, specialist conflict, cancellation boundary, completion retry, history, and concurrent destination commands.

Acceptance criteria:
- Real endpoints preserve the approved mock UX.
- The craft can be reconstructed from stored inputs.
- No batch or resource duplication occurs.
- Maker history follows later equipment and battle records.
~~~

## Prompt 13: Recruitment, companies, equipment, and recovery states

~~~text
Implement the Bastion company and minimum army model.

Support:
- recruitment and training;
- soldier count, officers, role, training, morale, fatigue, wounds, and veterancy;
- equipment slots at batch scale;
- quality, quantity, and condition summaries;
- partial equipment rules;
- formation eligibility and deployment state;
- killed, wounded, captured, missing, scattered, and recovered outcomes;
- serviceable, damaged, salvageable, captured, and lost equipment states;
- repair and recovery hooks.

Equip the real 100-sword batch and preserve maker provenance.

Do not model every soldier as an entity. Do not add mounts, ships, heroes, runes, or direct PvP.

Test assignment, removal, concurrent use, partial quantity, condition changes, casualty accounting, recovery, and invalid formation.

Acceptance criteria:
- An object cannot be used from incompatible ownership or deployment states.
- Soldier and equipment totals reconcile.
- Equipment effect is bounded and understandable.
- Defeat creates repair demand without deleting the permanent House.
~~~

## Prompt 14: Pure deterministic battle simulation

~~~text
Build the real battle simulation as a pure library.

Inputs include:
- rules and content version;
- explicit seed;
- companies or battalions;
- soldiers, equipment, morale, fatigue, officers, and orders;
- formation;
- terrain, weather, reconnaissance, fortification, and supply where currently supported.

Implement only the local Arkazia versus Sylvara conflict:
- opening ranged pressure;
- advance and engagement;
- basic roles and counters;
- flank or reserve response;
- morale, cohesion, retreat, and pursuit;
- casualty, capture, scattering, and equipment outcomes.

Emit:
- canonical result;
- versioned replay events;
- decisive-factor explanation;
- reconciliation totals.

Use a project-owned deterministic random algorithm. Do not depend on wall clock, database order, UI timing, PixiJS, or runtime-specific random behavior.

Add golden, property, invariant, edge-case, and benchmark tests.

Acceptance criteria:
- Same input, version, and seed produce byte-equivalent canonical output.
- Simulation runs headlessly.
- Renderer cannot affect results.
- Legal event order and conservation are verified.
- Result application remains a separate idempotent transaction.
~~~

## Prompt 15: Battle jobs, formation, replay, and real consequences

~~~text
Connect the real formation experience to the authoritative simulation.

Implement:
- validated formation plans;
- immutable battle-input snapshots;
- durable scheduled resolution;
- result and replay storage;
- idempotent application of casualties, equipment outcomes, rewards, and history;
- status, summary, explanation, and replay APIs;
- polling with backoff;
- PixiJS replay, speed, timeline, key moments, reduced motion, and fallbacks;
- post-battle comparison between intent and outcome.

Connect the full forged-batch path to battle and return consequences to the House Seat.

Test worker restart, duplicate resolution, stale formation, unavailable company, replay version compatibility, and end-to-end reconciliation.

Acceptance criteria:
- A stored battle replays consistently on another client.
- Forged equipment contribution and condition are visible.
- The player sees decisive causes.
- Retries cannot duplicate casualties, rewards, or history.
~~~

## Prompt 16: Contracts, bounded demand, market shell, and secondary materials

~~~text
Implement the minimum economy needed to choose between House use, kingdom work, and market opportunity.

Create:
- one Arkazian quartermaster contract for sword batches;
- bounded NPC demand with budget, stockpile, volume, deadline, and world-state inputs;
- one regional market mechanism for approved batches;
- listing or order, escrow, fee, expiry, fulfillment, cancellation, and delivery;
- transaction and audit history;
- one controlled Sylvaran timber or hide dependency to prove strategic materials without exposing a large catalogue.

Use a deliberately simple low-population price-discovery rule and document it.

Do not add cross-kingdom smuggling, complex auctions, Runeforging commissions, or many secondary professions.

Test competing buyers, cancellation during fulfillment, duplicate delivery, expiry, partial contract rules, bounded NPC purchases, and ledger reconciliation.

Acceptance criteria:
- A batch cannot be sold, contracted, retained, and equipped at once.
- NPC demand is finite.
- Price, fee, and destination are visible.
- The slice works with few human players.
- The strategic material remains contextual and understandable.
~~~

## Prompt 17: House reports, Situations, and first authored content

~~~text
Implement the real House Seat projections, offline reports, and a constrained Situation engine.

Reports answer:
- what completed while the player was away;
- what changed in resources, construction, forging, market, recruitment, and battle;
- what requires attention;
- which useful action fits a short or longer session.

Aggregate routine events while preserving detailed audit history.

The Situation engine supports:
- House and world entry conditions;
- capability, resource, specialist, reputation, item, and deadline checks;
- transparent requirements, costs, risks, and outcomes;
- immediate and scheduled effects;
- follow-up chains;
- content versioning;
- localization-ready text keys;
- preview and validation;
- only allow-listed domain actions.

Implement one grounded Situation such as the Lost Iron Convoy or a Sylvaran timber shortage. Do not implement rune content.

Acceptance criteria:
- Designers can add a basic Situation without application-code changes.
- One Situation cannot resolve twice.
- Active content survives version changes.
- Reports connect cause, action, and consequence.
- Returning players are not spammed by resource ticks.
~~~

## Prompt 18: Foundations of Iron real gate

~~~text
Harden and validate the authoritative medieval loop:

House Seat -> production -> construction -> barracks and forge -> recruitment -> forge 100 iron swords -> equip, sell, retain, or contract -> local battle -> losses, repair, payment, demand, and history -> return report.

Remove or isolate obsolete mocks. Verify clean migrations, upgrade migrations, API and worker restart, reconciliation, content validation, and projection rebuild.

Run unit, architecture, integration, content, end-to-end, accessibility, build, type, lint, visual, and benchmark suites.

Create:
- deterministic demo seed and reset command;
- operator troubleshooting guide;
- reconciliation report;
- telemetry for the Foundations of Iron questions;
- updated human playtest script;
- explicit pass, revise, and stop decision sheet.

The product owner must confirm that the real loop remains clear and satisfying. Do not add steel or runes before the gate decision.

Acceptance criteria:
- No normal action in the tested loop uses fake server state.
- The loop survives process restarts.
- Resources, gold, equipment, soldiers, and history reconcile.
- Retry cannot create extra value.
- A fresh tester can complete and understand the loop.

Stop for approval.
~~~

---

# Phase D: Build the bridge to First Flame

## Prompt 19: Steel, named weapons, and master smith progression

~~~text
After Foundations of Iron passes, implement the grounded bridge to Runeforging.

Add:
- one advanced forge or furnace capability;
- steel as a process and material grade, not another universal resource pile;
- Master Weaponsmith progression based on varied meaningful work;
- one named steel weapon pattern;
- named-item provenance, condition, repair, scars, owner, and history;
- one custom technique choice;
- a comparison showing why a steel masterwork matters without Aura;
- a regional progression Situation that foreshadows a Runestone.

Do not add runes yet. Do not make all iron obsolete. Keep cultural weapon roles useful.

Test progression prerequisites, named ownership, repair, history, concurrent transfer, and old-item explanation after rule version changes.

Acceptance criteria:
- Steel feels like economic and technical maturity.
- Named items are clearly distinct from batches.
- The future rune vessel can extend this model without becoming a batch.
- The path does not require useless crafting spam.
~~~

## Prompt 20: Runestones, discovery, appraisal, custody, and vault

~~~text
Introduce runes as world objects without Runeforging yet.

First extend the deterministic simulation tools with a configurable Runeforging risk model. It must model:
- visible success, rune-survival, and vessel-survival probabilities;
- clean success, scarred success, rejection, fracture, and catastrophe;
- destructible versus singular-rune policies;
- preparation choices;
- immutable result under retry;
- L0, L1, and L2 attempt funnels;
- high-destruction, over-safe, underprepared, master-smith, and singular-rune scenarios.

Export reproducible manifests and reports showing whether the proposed journey is impossible, trivial, or likely to feel abusive. Do not connect the risk model to player commands in this prompt.

Implement:
- one Fire Runestone;
- discovery through one authored expedition or Situation chain;
- unknown, discovered, appraised, secured, transferred, reserved, lost, and recovered states as needed;
- custody, owner or guardian, location, condition, and history;
- appraisal by a qualified specialist;
- secure storage through the Vault;
- destructibility and singularity policy fields;
- transactional transfer and anti-duplication rules;
- a restrained rune codex that reveals only discovered knowledge.

The Fire Rune is destructible. Seed disabled fixtures for a singular Mystic or Primal rune to prove that ordinary destruction transitions reject them.

Do not give the Fire Rune combat power and do not implement L0 yet.

Test concurrent claims, duplicate discovery, custody transfer, loss/recovery, vault prerequisites, appraisal versioning, and singular-rune protection.

Acceptance criteria:
- Exactly one canonical Fire Rune instance exists in the slice.
- The rune is valuable before activation.
- The UI communicates custody and danger.
- A singular rune cannot enter an ordinary destroyed state.
- The risk simulator is deterministic and exposes the progression and destruction funnel before L0 implementation.
~~~

## Prompt 21: Rune vessel preparation and L0 Runeforging

~~~text
Implement the first real Runeforging attempt.

Add:
- Vessel Smith capability;
- conversion or preparation of the approved named steel weapon into an eligible vessel;
- Fire Rune compatibility;
- binders, catalysts, safeguards, forge configuration, and assigned smith;
- a transparent pre-attempt risk panel;
- clean success, scarred success, rejection, fracture, and catastrophe;
- destructible Fire Rune behavior;
- vessel damage or Broken Relic outcomes;
- specialist injury or recovery hooks where configured;
- one immutable attempt result under retry;
- complete attempt history and explanation;
- L0 Dormant weapon creation on success.

Persist:
- formula and content version;
- probability snapshot;
- input identities and ownership;
- seed reference or deterministic entropy record;
- result;
- consumed, surviving, damaged, and destroyed objects;
- reports and history.

The client never supplies the result. A duplicate confirmation returns the original attempt and outcome. Do not implement L1, Aura, fusion, extraction, or commissions.

Add unit, property, integration, concurrency, worker-restart, and end-to-end tests for every outcome class.

Acceptance criteria:
- Odds and consequences are visible before confirmation.
- One confirmation produces one result.
- Fire Rune destruction is final and ledgered when valid.
- L0 has no active Aura.
- Failure produces meaningful state and history rather than a generic error.
~~~

## Prompt 22: Wielder bond, resonance, deeds, and L1 awakening

~~~text
Implement the journey from L0 Dormant to L1 Enhanced.

Add:
- eligibility and assignment of the L0 weapon to one named officer;
- weapon-wielder bond;
- resonance gained from approved training, battles, and Situations;
- anti-farming limits and meaningful source categories;
- one Fire-specific awakening deed;
- visible readiness requirements;
- return to a qualified Runeforger;
- a transparent L1 awakening attempt using the same immutable risk engine;
- L1 Enhanced state and Conduit capability on success;
- restrained Fire Aura battle event and replay effects;
- weapon, wielder, smith, and House history.

Resonance is not a generic endlessly farmable XP bar. The deed and forge both matter.

Do not implement L2, Aspect percentages, rune extraction, or multiple rune families.

Test assignment, transfer restrictions, resonance idempotency, deed qualification, attempt outcomes, retry, battle replay compatibility, and removal or death edge cases.

Acceptance criteria:
- The player understands why the weapon became ready.
- The smith remains necessary.
- L1 is visibly exceptional but does not invalidate companies.
- Repeated trivial actions cannot efficiently farm resonance.
- Failed awakening preserves coherent rune and vessel states.
~~~

## Prompt 23: L2 Artifact prototype and singular-rune failure policy

~~~text
Build a controlled accelerated L2 prototype for product validation. Do not tune it as final live progression.

Implement:
- mature L1 bond fixture or accelerated test path;
- one landmark Fire deed;
- one rare catalyst and Legendary Runeforger requirement;
- transparent Artifact ascension attempt;
- configured outcomes for rune, vessel, wielder, and smith;
- L2 Artifact state;
- staged 25, 50, 75, and 100 percent Aspect metadata and one restrained visual demonstration;
- complete history and permanent scars.

Also test the same failure engine with a non-playable singular-rune fixture:
- the singular rune cannot be destroyed;
- catastrophe redirects consequence to vessel, specialist, dormancy, rejection, displacement, or a follow-up Situation;
- no branch duplicates or silently deletes it.

Do not implement a full combat kit, all Aspect families, fusion, Chaos, Order, or L3.

Acceptance criteria:
- Artifact success feels like the result of settlement, forge, wielder, deed, and risk.
- The player can explain the difference between L0, L1, and L2.
- Singular-rune protection still has severe consequences.
- L2 does not become an ordinary market recipe.
- All outcomes are reproducible and auditable.
~~~

## Prompt 24: First Flame gate

~~~text
Audit and package the complete distinctive loop:

steel masterwork -> Fire Runestone discovery -> appraisal and custody -> vessel preparation -> visible L0 risk -> success or meaningful failure -> L0 assignment -> resonance and deed -> visible L1 risk -> Conduit moment -> accelerated L2 validation -> full weapon history.

Run all automated validation and inspect desktop, mobile, replay, failure, missing-asset, retry, and recovery paths.

Create a human playtest with separate seeded scenarios for:
- clean L0 success;
- rune-destroying failure;
- scarred success;
- L1 awakening;
- Artifact attempt;
- singular-rune catastrophe.

Measure:
- risk comprehension;
- perceived fairness;
- preparation choices;
- emotional response to loss;
- whether failure creates a desire to recover or quit;
- whether the player values the rune before power;
- whether the weapon history is remembered;
- desire to begin a second weapon journey;
- whether Aura remains exceptional.

Classify the gate as proceed, revise, or stop. Do not add multiplayer merely because automated tests pass.

Acceptance criteria:
- Testers understand odds and ownership.
- No retry rerolls an outcome.
- Destruction and singular protection behave as stated.
- The forging journey is strong enough to justify the game's title.

Stop for the product owner's decision.
~~~

---

# Phase E: Closed asynchronous multiplayer

## Prompt 25: Authentication, House onboarding, and authorization

~~~text
After First Flame passes, add accounts without changing the proven progression.

Implement the approved authentication approach:
- invited closed-test registration;
- login, logout, renewal, and recovery;
- server-side authorization for every House-owned command and read model;
- rate limiting and anti-forgery controls;
- audit for sensitive changes;
- privacy export and deletion hooks;
- separate test administrator permissions.

Onboarding covers:
- choosing Arkazia or Sylvara;
- naming the House;
- crest and motto;
- establishing the outpost;
- meeting the first smith;
- beginning Foundations of Iron.

Do not present all kingdoms or professions as fake choices.

Test object-level authorization, session behavior, duplicate names, invalid kingdom, interrupted onboarding, and duplicate rewards.

Acceptance criteria:
- One player cannot access another House's private state.
- Public market and Warfront projections expose only intended data.
- Onboarding resumes safely.
- Authentication retry cannot duplicate value.
~~~

## Prompt 26: Player market, ordinary commissions, and Runeforging risk contracts

~~~text
Extend the market from low-population shell to real player interaction.

Implement:
- public, direct, kingdom, allied, and Order-scoped ordinary crafting orders where currently supported;
- buyer-provided and smith-provided materials;
- escrow, reservation, fees, deadlines, minimum quality, cancellation, delivery, and dispute audit;
- maker reputation and order history;
- cross-House named-weapon custody transfer.

Then add a deliberately restricted direct Runeforging commission:
- explicit vessel, rune, catalysts, safeguards, smith, result ownership, fee, and loss allocation;
- exact probability and consequence disclosure;
- both parties accept one immutable risk contract;
- no party can cancel after the non-cancellable boundary;
- retry returns the same attempt;
- every outcome settles ownership, fee, surviving assets, and history transactionally.

Do not add anonymous high-volume rune gambling, auctions for unique runes, or paid protection.

Test competing actions, escrow, cancellation boundaries, disconnects, duplicate confirmation, smith unavailability, every outcome class, and reconciliation.

Acceptance criteria:
- Players understand who bears each risk.
- One object cannot be committed to two orders.
- Settlement is correct for success and failure.
- Support can reconstruct the complete attempt.
~~~

## Prompt 27: Orders, regional dependency, and seven-day Warfront

~~~text
Implement the smallest useful cooperative and competitive layer for the closed test.

Orders support up to five Houses initially:
- invite, join, leave, removal, and leadership transfer;
- minimal roles and explicit permissions;
- activity feed;
- ledgered warehouse;
- shared supply objective;
- one cooperative expedition or defense operation;
- standing instructions.

Implement one seven-day Arkazia versus Sylvara Warfront:
- configurable phases and objectives;
- equipment, combat, construction, and limited logistics contributions from real systems;
- contribution categories rather than one combat score;
- regional demand and route changes;
- a chance to reveal the Fire Runestone chain without guaranteeing one to every participant;
- deployment budgets and anti-spam limits;
- responsive bounded NPC Houses;
- permanent history and temporary seasonal state.

Permanent settlements cannot be destroyed offline.

Test permissions, warehouse concurrency, member removal with committed assets, time boundaries, restart recovery, late join, ties, contribution abuse, and resolution.

Acceptance criteria:
- One thoughtful daily session is useful.
- Forge, trade, and combat contributions are visible.
- Regional conflict changes demand without infinite buying.
- New Houses have useful tasks.
- Warfront completion cannot reset permanent progression.
~~~

## Prompt 28: Telemetry, security, resilience, assets, and cloud readiness

~~~text
Harden the closed-test build without adding gameplay.

Telemetry must cover:
- settlement milestone time;
- production, construction, and storage bottlenecks;
- gold faucets, sinks, balances, and concentration;
- equipment made, traded, equipped, damaged, repaired, captured, lost, and unsold;
- smith profitability and market fulfillment;
- rune discovery, custody, attempt funnels, destruction, failure classes, and abandonment;
- Warfront contribution by category and account age;
- battle outcomes by content version;
- job, outbox, projection, and worker health;
- onboarding and session cadence.

Create support traces for House, ledger entry, batch, named weapon, rune, forge attempt, battle, order, and Warfront contribution.

Harden:
- authorization and object access;
- validation, CSRF, XSS, injection, uploads, and asset manifests;
- rate and repeated-command abuse;
- secret handling;
- migrations, backups, and tested restore;
- worker recovery and safe deployment;
- replay payload and mobile rendering performance;
- accessibility and PWA behavior;
- approved versioned asset storage and fallbacks.

Prepare cost-aware Azure deployment manifests or infrastructure definitions for the approved student-credit architecture. Keep Docker portability. Do not deploy yet.

Acceptance criteria:
- Critical economy and rune invariants have alerts or reconciliation.
- Admin corrections are audited domain or ledger operations.
- Missing art cannot block play.
- Backup and restore are tested.
- Measured limits and next bottlenecks are documented.
- No unresolved critical security issue remains.
~~~

## Prompt 29: Deploy and run the 20-player closed gate

~~~text
Deployment and invitations require explicit product-owner authorization.

Prepare and, once authorized, deploy a controlled 20-player environment using the approved Azure for Students architecture and budget controls.

Include:
- staging and closed-test environments;
- migrations and tested recovery;
- budgets and cost alerts;
- logs, traces, queue, economy, rune, and security alerts;
- invitation administration;
- deterministic rehearsal seed;
- incident and pause runbooks;
- in-product feedback with correlation IDs;
- participant brief stating expected cadence and no overnight defense requirement;
- daily operator report;
- final gate report.

Run a simulated-House rehearsal before invitations. During the test, record every balance or content change with reason and effective time.

Evaluate:
- first-session settlement and forge comprehension;
- voluntary return and second actions;
- real buying, selling, commissioning, and supplying;
- ordinary and rune commission risk comprehension;
- equipment and battle explanation;
- rune loss and recovery sentiment;
- useful contribution by new Houses;
- sleep pressure and burnout;
- inflation, shortages, monopoly, duplication, and job reliability;
- memorable House, smith, and weapon stories.

Classify as proceed, revise, or stop.

Acceptance criteria:
- No unresolved critical security, duplication, or data-loss issue.
- Test can pause without destroying permanent state.
- Evidence is separated from anecdotes.
- Cloud cost stays within the approved budget.
- The next phase is justified by measured results.
~~~

---

# Phase F: Only after the closed gate succeeds

## Prompt 30: Reusable seasons and first restrained Chaos crisis

~~~text
Run only after Prompt 29 concludes proceed and the product owner authorizes it.

Implement a minimal reusable season framework with rumours, escalation, crisis, and resolution. Keep permanent House state separate from seasonal state in code, migrations, APIs, tests, and tools.

Introduce Sanguessuga as a singular world object and narrative threat:
- one canonical instance;
- location, custody, bearer, condition, corruption, activations, and history;
- collective decisions and counterplay;
- no ordinary loot ownership;
- no unrestricted playable Dreadform yet;
- no duplication under concurrent claims or seasonal changes.

Create one crisis chain connecting settlement supply, forging, research, expeditions, battles, corruption, and containment.

Do not implement all Chaos Weapons or full L3.

Acceptance criteria:
- Seasonal reset cannot delete permanent progression.
- Sanguessuga cannot duplicate.
- Craft and non-combat paths matter.
- Aura escalation is rare and costly.
- Season content is data-driven rather than code-forked.
~~~

## Prompt 31: Cooperative Weapon of Order prototype

~~~text
Do not implement until the Order living-anchor rule is approved in canon.

Design and build one controlled Weapon of Order project using proven systems:
- final purified rune identity;
- legendary rune vessel;
- multi-stage contributions from forging, mining, construction, healing, transport, scholarship, and military protection;
- Order and kingdom permissions;
- transparent custody;
- irreversible stages and failure handling;
- living-anchor consent and consequences;
- one counter interaction with the restrained Chaos crisis;
- permanent project and weapon history.

The Order Weapon is not a high-damage personal reward. It stabilizes, exposes, contains, or creates an opening against Chaos.

Do not add all Order Weapons, all kingdoms, or unrestricted Ascendant gameplay.

Acceptance criteria:
- One canonical instance exists.
- No single player can silently seize or duplicate the project.
- Contributions from several systems are meaningful.
- The approved moral distinction between Chaos and Order is represented.
- Failure and custody remain auditable and narratively visible.
~~~

## Prompt 32: Add one kingdom profession or system through evidence

~~~text
Use this prompt once per expansion slice. Add only one meaningful dependency.

Choose from evidence, for example:
- Sylvaran forestry, skinning, heartwood, or healing;
- Veridorian shipbuilding and maritime access;
- Arkazian quarrying, fortification, or advanced metallurgy;
- Zandrian mining, vault engineering, or siege works;
- another kingdom only when its settlement, resources, units, trade, and politics materially change the proven loop.

Before coding, create a small design package:
- player fantasy and first action;
- settlement role;
- demand and sinks;
- universal versus strategic materials;
- dependencies with forge and existing systems;
- kingdom access and foreign commissioning;
- Warfront and Situation effects;
- onboarding and catch-up;
- simulation impact;
- art and content needs;
- measurable success and stop criteria.

No secondary profession receives runes merely to appear important.

Implement through existing construction, job, ledger, contract, market, army, Situation, history, telemetry, and asset contracts. Stop if broad special cases reveal a missing abstraction or an overbroad feature.

Acceptance criteria:
- The addition creates a new decision, not another timer.
- A novice can contribute.
- Existing Houses need its output and it needs existing outputs.
- Inventory complexity remains controlled.
- Simulation and playtest show viable demand without monopoly.
~~~

---

# Permanent guardrails

1. Medieval foundation first; Runeforging remains the long-term centre.
2. Prove Foundations of Iron before implementing First Flame.
3. Prove First Flame before scaling multiplayer.
4. One settlement evolves visibly; do not add village spam.
5. Buildings unlock capabilities, not endless percentage levels.
6. Six universal resources support ordinary play.
7. Named materials appear contextually.
8. Ordinary forging has a guaranteed floor; destructive chance belongs to explicit Runeforging risk.
9. One confirmed Runeforging attempt has one immutable outcome.
10. Destructible and singular runes have different failure policies.
11. Batches equip companies; named and Runeforged weapons belong to notable wielders.
12. War creates demand and deeds but does not replace the forge as the game's identity.
13. Secondary professions support the village and world without mandatory runes.
14. Battles are deterministic, server-authoritative, explainable, and replayed by the client.
15. Deployed assets can be at risk; a sleeping player's permanent settlement cannot be erased.
16. Seasons refresh conflict without wiping belonging.
17. Human playtest gates outrank the amount of code already written.
18. Never monetize forge odds, rune safety, combat power, or time pressure.

---

# Initial Plan-mode prompt

Copy the Global Agent Contract, then append the following:

~~~text
Activate only Prompt 1: Tech stack and architecture.

Start in Plan mode. Read the two v0.2 planning files and every project_sources Markdown file completely. Inspect the repository and working tree without modifying anything.

Resolve the architecture for the entire medieval-to-Artifact journey while preserving the implementation order: Foundations of Iron first, First Flame second, multiplayer third. Treat the Game Workbase as the product source of truth and this prompt pack as the execution contract.

Account for my C#/.NET experience and Azure for Students. Prefer the ASP.NET Core, .NET Worker, React, TypeScript, Vite, PixiJS, PostgreSQL, Docker Compose, and portable Azure Container Apps baseline unless repository evidence demonstrates a better option.

Ask only questions whose answers materially change architecture. Finish with an implementation-ready Prompt 1 plan and stop for my approval. Do not edit, scaffold, install, deploy, or proceed to Prompt 2.
~~~
