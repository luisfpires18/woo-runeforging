# Domain glossary

The shared vocabulary. When code, schemas, API contracts, UI copy and
conversation use the same words for the same things, a whole class of confusion
disappears.

**Label key** — from the Workbase §24 register:

| Label | Meaning |
|---|---|
| **Locked** | Established by the creator or existing canon |
| **Foundation** | The recommended design to build and test — revisable |
| **Open** | Unresolved. **Never turn into canon.** Represent as configuration, a nullable field or a documented placeholder |
| **Later** | Deliberately excluded from early stages |

Terms without a label are architectural rather than product decisions.

**Canon is the higher authority.** Where an entry here and a file in
[`project_sources/`](../../project_sources/) disagree, the canon file wins and
this document is wrong. §11 lists the canon's own internal contradictions,
which are open questions rather than errors to fix here.

**Bold entries are implemented in code.** Everything else is vocabulary for
systems that do not exist yet.

---

## 1. The player and their holdings

| Term | Meaning | Label |
|---|---|---|
| **Settlement** | The player's domain: one evolving site, and the unit of ownership, identity, reputation and history. **One settlement per player** — no village spam, and since the merge recorded in [ADR-0016](../adr/0016-settlement-terminology.md) that is the shape of the model rather than a rule to enforce. *Implemented: `Settlement`* | Locked |
| **Outpost (the screen)** | The home screen. Answers: what completed while I was away, what needs attention, what advances the settlement today | Foundation |
| **Settlement stage** | Outpost → Village → Fortified town → Regional capital → Runic seat. The last is a late capability layer on the regional capital, not a separate tier. *Implemented: `SettlementStage`, **Outpost only** — later stages join when they are reachable* | Open (exact stages, names and pace) |
| **Outpost (the stage)** | The founding stage: survival and claim. A Command Hall, a storehouse, basic production, and later a militia and basic forge. Village, Town and City are **possible** later stages and nothing more — none is implemented, and Fort, Castle and Capital describe strategic roles rather than tiers | Foundation |
| **Building** | A structure in the settlement. Buildings unlock **capabilities**, not thirty levels of percentage increases. *Implemented: `Building`, `BuildingKind` — Command Hall, Storehouse, Lumber Yard, Quarry, Mine* | Locked |
| **Construction state** | `NotBuilt → UnderConstruction → Complete`. Driven by stored timestamps read on demand, never by a timer. **A construction cannot complete twice.** *Implemented: `ConstructionStatus`* | — |
| **Specialist** | A named person who performs work — smith, commander, scholar. The player makes settlement-level decisions; specialists do the work | Foundation |
| **Workforce** | Labour capacity. **A capacity, not an inventory resource** — it is never a spendable pile of tokens | Foundation |
| **Crest / motto** | The settlement's heraldry. Also the terminal fallback for missing art. The starting outpost carries an Arkazian token and no device of its own — it has no name yet | Foundation |

## 2. Economy

| Term | Meaning | Label |
|---|---|---|
| **Universal resources** | **Gold, Provisions, Timber, Stone, Ore, Workshop Supplies.** The six that support all ordinary play. *Implemented: `ResourceKind`* | Foundation |
| **Workshop Supplies** | Abstraction over charcoal, nails, cloth, oils, rope, bindings, containers, ordinary hides, tools and maintenance inputs | Foundation |
| **Resource pool** | A settlement's holdings across the six. **A spend can never take a balance below zero**, and a multi-resource cost is all-or-nothing: a cost that cannot be paid in full changes nothing at all. *Implemented: `ResourcePool`* | — |
| **Cost** | What an action requires, across one or more resources. Always spent whole; never partially paid. *Implemented: `ResourceCost`* | — |
| **Strategic material** | A named material appearing only when it creates a meaningful decision. Lives in a small separate inventory, never in the six | Foundation |
| **Material family** | A broad recipe slot — Metal, Wood, Stone, Hide or textile, Fuel or supplies, Reagent, Runic component | Foundation |
| **Ledger entry** | An append-only record of one resource movement: delta, reason, actor, correlation ID. **Every** gold and goods movement has one | — |
| **Balance** | Current holding of one resource by one settlement. Carries `accrued_through_utc` — production is computed from elapsed time, never ticked | — |
| **Reservation** | Resources committed to a project but not yet consumed. Has explicit release and consume transitions | — |
| **Bounded demand** | NPC and kingdom purchasing limited by budget, stockpile, deadline and world state. **There is no infinite vendor** | Foundation |

## 3. The forge

| Term | Meaning | Label |
|---|---|---|
| **Equipment batch** | A fungible quantity of identical equipment arming a company — quantity, quality, condition, maker mark. Not hundreds of individual records | Locked |
| **Named weapon / named item** | An individual object with identity, materials, maker, owners, repairs, scars and deeds. **A distinct aggregate from a batch, with no conversion path** | Locked |
| **`ForgeCraft`** | Ordinary crafting. **Deterministic**: transparent duration, guaranteed quality floor, no probability model anywhere | Foundation |
| **Guaranteed result floor** | Ordinary forging cannot destroy client materials through hidden random quality. Destructive chance belongs to Runeforging alone | Foundation |
| **Technique** | A design or process emphasis chosen per craft. Part of smith identity and reputation | Foundation |
| **Pattern** | An authored weapon design — `pattern.sword.infantry.arkazian` | — |
| **Grade** | Material quality tier: improvised → bronze or low-grade iron → reliable iron → tempered → steel → rare-material masterwork → rune vessel | Foundation |
| **Maker mark / provenance** | The record of who made an object and from what. Follows it into equipment records, battle history and the settlement's history | Foundation |
| **Destination** | Where a finished craft goes: equip, kingdom contract, market listing, player commission, Order supply, export, retain. **Exclusive — one only** | Locked |
| **Smith mastery** | Apprentice → Weaponsmith → Master Weaponsmith → Vessel Smith → Runeforger → Legendary Runeforger. Advanced by varied meaningful work, never by producing thousands of useless daggers | Foundation |

## 4. Runes

| Term | Meaning | Label |
|---|---|---|
| **Runestone** | The natural world object a rune is discovered in | Locked |
| **Rune identity** | The single final identity a Runeforged weapon carries — Fire, Lightning, Blood, Psychic. **One per weapon** | Locked |
| **Destructible rune** | A rune that a failed attempt can destroy | Locked |
| **Singular rune** | Primal, Mystic and (pending §23.9) Mythical creature runes. Currently unique in canon. **Cannot be destroyed by ordinary failure** — `Singular → Destroyed` does not exist as a transition | Foundation |
| **Fusion** | Combining compatible rune inputs into one new final identity during a high-risk process. **Must resolve to one identity before the one-rune-per-weapon rule applies** | Open (§23.6) |
| **Rune vessel** | A named weapon prepared to accept a rune. A `NamedItem` with an additive `VesselCapability` — not a third hierarchy | Foundation |
| **Custody** | Who holds a rune, where, in what condition, with what history. Transfers are transactional and never duplicate | Foundation |
| **Appraisal** | A qualified specialist determining what a discovered rune is | Foundation |
| **`RuneforgingAttempt`** | One confirmed attempt. Records formula version, content version, probability snapshot, inputs, seed reference, outcome and consequences. **One confirmation, one immutable outcome** | Locked |
| **Failure ladder** | Clean success · Scarred success · Rejection · Fracture · Catastrophe | Foundation |
| **Probability snapshot** | The exact odds shown to the player, persisted with the attempt. **No hidden modifier may exist outside it** | Locked |
| **Broken Relic** | What a vessel may become after a fracture | Foundation |

## 5. Weapon levels and Aura

The Workbase §23.5 resolution — **the level names the weapon, the state names
what the wielder does with it** — is adopted throughout.

| Term | Meaning | Label |
|---|---|---|
| **L0 — Dormant** | The rune is bound; the weapon has no active Aura power. Still valuable: unique identity, bonding can begin, history accumulates | Locked |
| **L1 — Enhanced** | The weapon after a successful awakening. **Conduit** is its active state — the wielder channels the rune through it | Locked |
| **L2 — Artifact** | The weapon after ascension. **Aspect** is its staged transformation, mastered at 25 / 50 / 75 / 100 % | Locked |
| **L3 — Dreadform / Ascendant** | Requires fusion with Chaos or Order. **Dreadform** for Chaos, **Ascendant** for Order. A world event, not personal progression | Locked / Later |
| **Resonance** | The bond between a weapon and its named wielder, built through approved training, battles and Situations. **Not an endlessly farmable XP bar** | Foundation |
| **Deed** | A specific rune-appropriate act satisfying an awakening or ascension condition. Both the deed and the forge are required | Foundation |

## 6. Armies and battles

| Term | Meaning | Label |
|---|---|---|
| **Company** | Roughly 50–150 soldiers. Tracks role, training, morale, fatigue, wounds, officers and equipment | Foundation |
| **Battalion** | Several companies. The main simulation entity for larger battles | Foundation |
| **Loadout** | What a company is equipped with, at batch scale. Partial equipment matters | Foundation |
| **`BattleInput`** | The immutable snapshot taken at scheduling: rules version, content version, seed, sides, formation, terrain, weather, orders. Editing a roster afterwards cannot change a scheduled battle | — |
| **`BattleResult`** | The canonical outcome. Byte-equivalent for identical input, version and seed | — |
| **`BattleEventLog`** | The ordered, versioned event stream. **The only thing the renderer consumes** | — |
| **`BattleExplanation`** | Decisive factors, derived from the log. Drives the post-battle report | — |
| **Casualty categories** | Killed · wounded · captured · missing · scattered · recovered | Foundation |
| **Equipment outcomes** | Serviceable · damaged · salvageable · captured · lost | Foundation |

## 7. World and multiplayer

| Term | Meaning | Label |
|---|---|---|
| **Situation** | A short problem generated from settlement and world state, resolved using capabilities, specialists, armies, knowledge, gold, relationships or history | Foundation |
| **Contract** | An agreement to supply goods: pattern, quantity, minimum quality, materials, fee, deadline, destination | Foundation |
| **Commission** | A direct player-to-player crafting order. A **Runeforging commission** additionally fixes ownership, risk disclosure, loss allocation and per-outcome fees, accepted by both parties before the attempt becomes immutable | Foundation |
| **Order** | A guild of settlements, coordinating what one cannot do alone | Foundation |
| **Warfront** | A temporary contested regional conflict. Creates demand and deeds. **Does not erase permanent settlements** | Locked |
| **Season** | A cycle refreshing contested regions, rankings, offices and storyline. **No full account wipes** | Locked |
| **Permanent state** | Settlement, specialists, forge mastery, buildings, army roster, named and Runeforged weapons, relationships, titles, history | Locked |
| **Seasonal state** | Contested regions, Warfront influence, temporary depots, crisis knowledge, rankings, offices, active storyline | Locked |
| **History** | The append-only public record: construction, techniques, maker marks, owners, repairs, rune custody, **every Runeforging attempt including failures**, awakenings, battles, captures, recoveries | Foundation |

## 8. Chaos and Order

| Term | Meaning | Label |
|---|---|---|
| **Chaos Weapon** | A unique, soul-bound, living, corruptive weapon created by the Thalori. **One canonical instance each.** Never ordinary loot. Every activation has a personal and regional cost | Locked |
| **Weapon of Order** | A constructed counter. Stabilises runaway Aura, exposes the Chaos bond, contains corruption, creates an opening. **Not a high-damage personal reward** | Foundation |
| **Living anchor** | What L3 requires. Chaos traps a soul in the weapon; Order is proposed to use a consenting living bearer whose soul remains in the body | **Open** (§23.4) |
| **Fixation** | Proposed excessive-Order consequence: gradual loss of flexibility, emotion and free choice to a single perfect purpose | Open |

## 9. Architectural terms

In use today:

| Term | Meaning |
|---|---|
| **Feature folder** | A slice of the one application owning its endpoints, domain types and persistence configuration in one directory. Not a project, not an assembly |
| **Aggregate** | A cluster of objects saved and loaded as a unit. **Settlement** is the only one so far: it owns its buildings and its resource balances |
| **Elapsed-time progression** | Progress stored as `StartedAtUtc` / `CompletesAtUtc` and computed when state is read. **No timer, no scheduler, no job row** |

Vocabulary for infrastructure that is **deferred, not present** — see
[ARCHITECTURE.md §8](../architecture/ARCHITECTURE.md#8-deferred) for the trigger
that reintroduces each:

| Term | Meaning | Arrives |
|---|---|---|
| **Due job**, **lease** | A durable unit of work claimed under bounded ownership | Only if elapsed-time resolution proves insufficient |
| **Outbox** | Domain events written in the same transaction as their cause, dispatched after commit. **Post-commit reactions only — never maintains an invariant** | When a reaction must survive a crash and cannot be recomputed |
| **Idempotency key** | A client-supplied key inserted in the effect transaction; a duplicate returns the stored response | Prompt 9 |
| **Content version**, **rules version** | Identifiers persisted on a craft, battle or attempt so an old object stays explainable after balance changes | With authored content |
| **`ActorContext`** | Who is acting: account, settlement, roles. **`SettlementId` always comes from here, never from a request body** | Prompt 25 |
| **Correlation ID** | One identifier reconstructing a whole causal chain | With telemetry, Prompt 28 |

---

## 10. Open canon register

**These conflicts are unresolved. Do not resolve one by writing code that
assumes an answer.** Where a schema must exist anyway, use configuration, a
nullable field, or a documented placeholder — and record it here.

Sourced from Workbase §23.

| # | Conflict | Handling until resolved |
|---:|---|---|
| 1 | **Victura** uses *Necrosis* in one source and *Necro* in others | Content-level naming. Pick one in content data with an alias field; not a code decision |
| 2 | **Vantashields** uses *Metorite* or *Meteorite* in one source and *Tarnish* in the Aura source | As above |
| 3 | **Ruincoils** uses *Entropy*, absent from the Corrupted Rune list | Rune family taxonomy must permit an unlisted family without failing validation. Flag, do not invent |
| 4 | **Order contains no soul** in one source, while **L3 Soul Entrapment requires a living soul** in another | **Blocks Prompt 31.** The living-anchor model is a nullable configuration on the Order project, not a hard-coded rule |
| 5 | L1 uses *Enhanced* and *Conduit*; L2 uses *Artifact* and *Aspect* | **Recommended resolution adopted architecturally:** the level names the weapon, the state names the active use. Recorded as a resolution *proposal*, not canon |
| 6 | Fused elements and Chaos/Order combinations must resolve to **one final identity** before the one-rune-per-weapon rule applies | Fusion resolves to a single identity before binding. The content validator rejects unsupported fusion |
| 7 | The exact physical process and material requirements for **Chaos and Order** are incomplete | **Blocks Prompt 31.** No schema assumes a recipe shape |
| 8 | Which discoverable rune families are **renewable after destruction** | A per-family `renewal_policy` configuration field with no default behaviour assumed |
| 9 | Whether **all singular Mythical runes** are indestructible in the same way as Mystic and Primal | The `Destructibility` field is per rune instance and authored per family. **Mythical is not assumed indestructible** — it is set explicitly in content and reviewed when canon lands |

### Open product decisions (Workbase §24)

Not conflicts, but unresolved. Represented as configuration or balance data,
never as hard-coded rules:

1. Exact settlement stages, names and pace.
2. How soon normal players reach their first L0 attempt.
3. Exact forging and Runeforging probabilities.
4. Which preparations modify rune survival, vessel survival and success.
5. Whether an L2 failure can permanently destroy the named vessel.
6. How standard Runestones re-enter the persistent world after destruction.
7. Whether every Mythical rune is indestructible *(also §23.9)*.
8. The full Order living-anchor and Fixation rule *(also §23.4)*.
9. Whether a settlement can defect or change kingdom.
10. How often named weapons can be captured or permanently lost.
11. The exact number and depth of secondary profession specializations.
12. Whether the player character is also a visible smith or only the leader employing smiths.
13. How much control remains after an autobattle starts.
14. The final commercial model.

---

## 11. Canon source gate

**[`project_sources/`](../../project_sources/) is present and has been read in
full** — 12 canon Markdown files, supplied 3 August 2026 and read completely
during Prompt 3.

### What the slice uses

Only Arkazia matters to the built model so far:

| Term | Canon | Label |
|---|---|---|
| **Arkazia** | Capital **Obsidia**. Mountain strongholds, fortified passes, stone-built towns, harsh ridgelands, alpine forests, **iron-rich slopes**. Discipline, fortresses, steel and elite cavalry | Locked |
| **Sylvara** | Capital **Unitas**. Deep forests, herb meadows, river cutbanks. Exceptional timber, hides, food and herbs; imports heavy metal and fortress stone. **The first border is Arkazia versus Sylvara** | Locked |
| **Bastion** | Arkazia's core line infantry — Sword + Shield — recruited at the **Red Bastion** barracks. The company of the first slice | Locked |
| **Warden** | Sylvara's core line infantry — Spear + Shield — from **Greenwatch Hall**. The first opposing force | Locked |
| **Two-slot rule** | Every wield is **two slots, one hand each**. Two-handed takes both; Sword + Shield takes one each | Locked |

Arkazia's geography is why the starter content makes Stone and Ore plentiful and
**Timber the pressure** — which is what gives a Sylvaran timber trade something
to be worth, later.

**The other five kingdoms** — Veridor (Azure), Nordalh (Haven), Draxys
(Scorcheye), Lumus (Sol), Zandres (Deephearth) — are canon and are **not
modelled**. `Kingdom` has one member.

### Conflicts found by reading the canon directly

§10 lists the conflicts the Workbase predicted. Reading the sources confirmed
them and added two. **None blocks current work** — the slice has no runes, no
weapons and no combat. All remain **unresolved**.

| Conflict | Sources |
|---|---|
| Victura's rune is *Necrosis* vs *Necro* | `weapons_of_chaos_and_order.md` vs `rune_list.md` — confirms §10.1 |
| Vantashields' rune is *Metorite* vs *Meteorite* | same pair — confirms §10.2 |
| Ruincoils uses *Entropy*, which the corrupted-rune list omits | same pair — confirms §10.3 |
| L1 and L2 headings name the **state** where the Workbase names the **weapon** — "LEVEL 1 – CONDUIT", "LEVEL 2 — ASPECT FORM" | `aura_levels.md` vs `runeforged_weapons.md` ("a L1 weapon is called Enhanced") — confirms §10.5 |
| Order and souls: "contain no soul, only harmony" vs Ascendant's "sacrificed soul" vs Soul Entrapment being "a requirement for the creation of weapons of chaos / order" | `weapons_of_chaos_and_order.md`, `aura_levels.md`, `runeforged_weapons.md` — confirms §10.4, still blocks Prompt 31 |
| **New:** *Protect* (Fortitude + Order), the Bulwarkers' rune, is absent from the Purified Runes list | `weapons_of_chaos_and_order.md` vs `rune_list.md` |
| **New:** *Ascendant* is "Beast + Order" on Skyrend Talons but "Any Animal" in the rune list | same pair |

Two entries in `rune_list.md` are **blank rather than contradictory** — Quartz
(Crystal) and Steel (Iron) have no description. That is missing canon, not a
conflict, and Prompt 20 will need it.

See [`../implementation/STATUS.md`](../implementation/STATUS.md).
