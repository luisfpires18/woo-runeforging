# Weapons of Chaos and Order

## Agent AI Implementation Prompts

**Date:** 1 August 2026  
**Product source:** Weapons_of_Chaos_and_Order_Game_Workbase.md  
**Canon sources:** all Markdown files in project_sources/  
**Purpose:** A controlled prompt sequence for planning and implementing the medieval-first, forging-centred game without attempting the full persistent world at once.

---

# How to use this file

Give the implementation agent:

1. The Global Agent Contract.
2. Exactly one numbered prompt.
3. Any approval or correction produced by the previous gate.

Run the prompts in order. Do not execute multiple numbered prompts in one change set. Every prompt must stop with reviewable documentation, validation, and an explicit readiness statement.

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
1. Read Weapons_of_Chaos_and_Order_Game_Workbase.md completely.
2. Read Weapons_of_Chaos_and_Order_Agent_AI_Implementation_Prompts.md completely enough to understand the active prompt, its gate, and what later prompts deliberately defer.
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
- Treat duplicate user submissions and process restarts as normal where they can affect valuable state.
- Commands moving gold, resources, equipment, runes, soldiers, or results must be transactional. Add idempotency only to commands that can realistically be retried or duplicated.
- One confirmed Runeforging attempt has one immutable outcome. A retry never creates another roll.
- Ledger every gold and goods movement.
- Keep permanent and seasonal state separate.
- Begin with one ASP.NET Core modular monolith and one PostgreSQL database. Keep background work inside the application until measured need justifies a separate worker.
- Use Gold, Provisions, Timber, Stone, Ore, and Workshop Supplies for ordinary play. Named materials appear only when they create a meaningful choice.
- Use equipment batches for companies, named objects for important wielders, and singular world state for unique runes and Chaos or Order Weapons.
- Store approved art with the application initially. Introduce an asset manifest or object storage only when the project needs them.
- Build responsive behavior, accessibility, migrations, and focused automated tests with each feature. Add deeper observability when operating a real test environment.
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

Read the workbase, this prompt pack, canon files, repository instructions, documentation, and existing code. Inspect the working tree.

Choose the smallest architecture that can build and test Foundations of Iron while leaving a clear path to First Flame:

- one ASP.NET Core modular-monolith application;
- feature folders rather than many projects or services;
- one EF Core `DbContext` and PostgreSQL database;
- one React, TypeScript, and Vite client;
- one small automated test project;
- Docker Compose for PostgreSQL only;
- GitHub Actions for build and tests;
- basic structured logs.

The API remains server-authoritative. Pure battle and Runeforging calculations must later accept explicit inputs and deterministic randomness, but do not create their schemas, services, or infrastructure now.

Document only:

- the browser, single backend process, and PostgreSQL boundary;
- the initial feature folders for Houses, Settlements, Resources, Forge, Armies, and Battles;
- a simple repository structure;
- EF Core migrations and transactions;
- how elapsed-time progression can use stored timestamps and resolve on access;
- where deterministic simulation code will live later;
- local development and basic CI;
- a short deferred section for authentication, a separate worker, object storage, Azure deployment, richer telemetry, markets, multiplayer, and Runeforging.

Do not design or prescribe a separate worker, outbox, job platform, object storage, multiple database contexts, cloud infrastructure, microservices, Redis, a broker, Kubernetes, or an OpenTelemetry stack.

The owner has Azure for Students, but deployment is deferred until a local playable slice exists. Verify stable framework versions from official documentation, then stop with a concise plan for approval.

Stop with a concrete plan for approval. Do not create the architecture files until the plan is approved. Do not proceed to Prompt 2.
~~~

## Prompt 2: Create the architecture package and bootstrap the repository

~~~text
Create the smallest working empty platform.

If the repository already contains architecture documentation from an earlier Prompt 1, simplify it first. Remove prescriptions for a separate worker, transactional outbox, general-purpose job system, object storage, Azurite, extensive cloud operations, many backend projects, or other infrastructure not required below. Preserve useful product decisions and future invariants in a short deferred section.

Create only:

- one ASP.NET Core application organized with simple feature folders;
- one React, TypeScript, and Vite application;
- one PostgreSQL database accessed through EF Core and one `DbContext`;
- one automated test project;
- Docker Compose for PostgreSQL only;
- one basic `/health` endpoint;
- one simple API endpoint that proves the web client can call the backend;
- basic structured console logs;
- GitHub Actions that restore, build, test, lint, and type-check;
- a short README with exact local start commands;
- a concise architecture document and implementation status update.

Use stable supported versions. Pin the .NET SDK in `global.json`. Keep configuration and secrets out of source control and include only safe examples.

Do not add:

- gameplay or lore data;
- authentication;
- a separate worker;
- background-job infrastructure;
- a transactional outbox;
- object storage or Azurite;
- PixiJS;
- Redis or a message broker;
- multiple `DbContext` instances or schemas per feature;
- OpenTelemetry infrastructure;
- architecture test frameworks;
- Azure resources, Bicep, deployment, or image publishing;
- Kubernetes or microservices.

Acceptance criteria:

- A clean checkout can start PostgreSQL, run the backend, and run the frontend using documented commands.
- The frontend renders a structural shell and successfully calls the simple API endpoint.
- The solution builds and the focused tests pass.
- The frontend type-checks and lints.
- CI runs the same core build and test commands.
- No secrets are committed.
- No gameplay or future infrastructure is implemented.

Stop after Prompt 2. Report the exact commands run and leave changes uncommitted for review.
~~~

## Prompt 3: Foundations of Iron domain model and starter content

~~~text
Create only the domain model and starter content needed for Foundations of Iron:

- one House and one Outpost settlement;
- the six universal resources;
- the first required buildings and construction state;
- one named smith and basic forge capability;
- one iron sword equipment batch;
- one company and its equipment assignment;
- one local battle input and result contract.

Use plain C# types and focused tests. Add EF Core persistence only where the next playable action needs it. Seed the minimum Arkazian and Sylvaran content needed by this slice.

Do not model Runes, Runeforging, markets, Orders, Warfronts, seasons, all settlement tiers, all kingdoms, or their database tables yet. Record only a short note showing where those later features can extend the current model.

Required rules:

- resources cannot be spent below zero;
- a construction or craft cannot complete twice;
- one equipment batch has one current destination;
- the same batch cannot be equipped and sold simultaneously;
- battle results cannot be applied twice.

Acceptance criteria:

- The first-slice rules are understandable and covered by focused tests.
- No unused future domain framework is created.
- Starter content is small, readable, and replaceable.
- The existing application remains easy to run.

Stop at the platform gate.
~~~

---

# Phase B: Model and mock Foundations of Iron

## Prompt 4: Foundations of Iron UX and visual design

~~~text
Design the first playable experience before building its mocked screens.

Create a compact design package for Foundations of Iron:

- first-session and returning-player journeys;
- information architecture and navigation;
- low-fidelity wireframes for the House Seat, settlement, construction, forge, army, and battle report;
- a grounded medieval visual direction for Arkazia with restrained Sylvaran contrast;
- typography, color, spacing, surfaces, icon, and interaction tokens;
- reusable component inventory;
- desktop and mobile layouts;
- loading, empty, error, unavailable, success, and offline states;
- accessibility and readability requirements;
- notes for later settlement illustration and PixiJS replay work.

Keep the design focused on the first outpost, barracks, forge, iron swords, company, and local conflict. Runes may be foreshadowed but are not a visible system.

Do not implement production components or choose expensive design infrastructure. Use simple Markdown and image or Figma artifacts only if they materially improve the decisions.

Acceptance criteria:

- The first useful action is obvious.
- Settlement growth, forging, army readiness, and consequences have distinct visual identities.
- Mobile preserves all essential decisions.
- The package is specific enough for Prompt 5 to implement without inventing the product design.

Stop for design approval.
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

The settlement view must visibly change when a building is completed. Use approved bundled art where available; otherwise use coherent faction placeholders and a heraldic fallback. Do not use emoji as game art.

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

## Prompt 9: Persistence and safe elapsed-time actions

~~~text
After Prompt 8 is approved, implement the server foundation needed to replace mocks.

Use PostgreSQL for authoritative state. Store start and completion timestamps and resolve elapsed-time progress when the relevant state is read or changed. Do not create one timer or background job per House action.

Implement only:

- EF Core persistence and migrations for the approved slice;
- transactions for commands that spend or move resources;
- optimistic concurrency where two writes can conflict;
- a clock abstraction for time-based tests;
- unique action identifiers only for valuable commands that a client may submit twice;
- cancellation rules and clear non-cancellable boundaries;
- focused transaction history needed to explain resource and item changes.

Do not add a separate worker, transactional outbox, general-purpose job engine, leases, poison queues, Redis, or a broker. If a later feature proves that request-time resolution is insufficient, document that measured need before adding background infrastructure.

Prove with real PostgreSQL integration tests:

- a duplicated valuable command does not double-spend;
- concurrent writes cannot create negative resources or duplicate an item;
- offline elapsed time resolves correctly;
- an applied battle or forge result cannot be applied twice.

Acceptance criteria:
- Restarting the API loses no committed progress.
- Duplicate submissions are safe on protected commands.
- Time tests do not sleep.
- The solution remains one application and one database.
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

Create content-driven prerequisites, costs, duration, capacity changes, construction slots, cancellation boundaries, timestamp-based completion, reports, and visual settlement-state projections.

Do not implement every settlement stage. Represent future Village, Fortified Town, Regional Capital, and Runic Seat in content contracts and documentation only.

Construction upgrades capability rather than adding long percentage ladders. Include worker or specialist reservation where it creates a real choice.

Connect the approved mock UX to real state. Test duplicate start, prerequisite failure, resource reservation, cancellation, specialist conflict, completion retry, API restart, and projection rebuild.

Acceptance criteria:
- The real settlement visibly evolves.
- Construction survives API restarts.
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
- timestamp-based completion and durable reports;
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

## Prompt 15: Battle resolution, formation, replay, and real consequences

~~~text
Connect the real formation experience to the authoritative simulation.

Implement:
- validated formation plans;
- immutable battle-input snapshots;
- persisted battle input and server-side resolution;
- result and replay storage;
- idempotent application of casualties, equipment outcomes, rewards, and history;
- status, summary, explanation, and replay APIs;
- polling with backoff;
- PixiJS replay, speed, timeline, key moments, reduced motion, and fallbacks;
- post-battle comparison between intent and outcome.

Connect the full forged-batch path to battle and return consequences to the House Seat.

Test API restart, duplicate resolution, stale formation, unavailable company, replay version compatibility, and end-to-end reconciliation.

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

Remove or isolate obsolete mocks. Verify clean migrations, upgrade migrations, API restart, reconciliation, content validation, and projection rebuild.

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

Add unit, property, integration, concurrency, API-restart, and end-to-end tests for every outcome class.

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
- process, database, projection, and time-based action health;
- onboarding and session cadence.

Create support traces for House, ledger entry, batch, named weapon, rune, forge attempt, battle, order, and Warfront contribution.

Harden:
- authorization and object access;
- validation, CSRF, XSS, injection, uploads, and asset manifests;
- rate and repeated-command abuse;
- secret handling;
- migrations, backups, and tested restore;
- process recovery and safe deployment;
- replay payload and mobile rendering performance;
- accessibility and PWA behavior;
- approved versioned asset storage and fallbacks.

Prepare the smallest cost-aware Azure deployment plan for the student-credit architecture. Create infrastructure definitions only if deployment is approved as the immediate next step. Keep Docker portability. Do not deploy yet.

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
- logs, economy, rune, and security alerts;
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

Implement through the existing construction, resource history, contract, market, army, Situation, history, and telemetry paths. Stop if broad special cases reveal a missing abstraction or an overbroad feature.

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

# New-chat kickoff for Prompt 2

Copy the Global Agent Contract, then append the following:

~~~text
Start in Plan mode.

Repository: https://github.com/luisfpires18/woo-runeforging

Read these files completely:

- Weapons_of_Chaos_and_Order_Game_Workbase.md
- Weapons_of_Chaos_and_Order_Agent_AI_Implementation_Prompts.md
- AGENTS.md and relevant repository documentation

Inspect the repository, working tree, recent commits, installed SDKs, and current architecture documents without modifying anything.

Activate only the Global Agent Contract and Prompt 2.

Important correction: the earlier Prompt 1 documentation designed too much future infrastructure. The updated two planning files are now authoritative. Prompt 2 must use a genuinely minimal platform:

- one ASP.NET Core modular-monolith application;
- simple feature folders;
- one EF Core `DbContext`;
- PostgreSQL;
- one React, TypeScript, and Vite application;
- one automated test project;
- Docker Compose for PostgreSQL only;
- basic structured logs;
- GitHub Actions for build and tests.

Do not use dual TypeScript compiler installations. Select one stable TypeScript version supported by the chosen Vite and linting toolchain.

Do not add a separate worker, outbox, job platform, object storage, Azurite, PixiJS, authentication, Redis, a broker, OpenTelemetry infrastructure, architecture test frameworks, multiple database contexts, Azure resources, deployment workflows, Kubernetes, microservices, gameplay, or lore data.

The owner has Azure for Students, but cloud deployment is later. Local development must require no paid service.

The Prompt 2 plan must also state exactly how the existing architecture documentation will be simplified so it no longer prescribes unused infrastructure. Preserve useful game rules and future constraints in a short deferred section rather than implementing them now.

Return only a concise, ordered Prompt 2 implementation plan with exact validation commands and acceptance criteria. Do not edit files, install dependencies, commit, push, or proceed to Prompt 3. Stop for approval.
~~~