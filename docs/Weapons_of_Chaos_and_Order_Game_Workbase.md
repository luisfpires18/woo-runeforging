# Weapons of Chaos and Order

## Game Design Workbase

**Date:** 1 August 2026  
**Canon sources:** all Markdown files in project_sources/  
**Purpose:** Product source of truth for planning, prototyping, implementation, and playtest decisions.

### Decision labels

- **Locked:** explicitly established by the creator or existing canon.
- **Foundation:** the recommended design to build and test.
- **Open:** unresolved and not to be silently turned into canon.
- **Later:** deliberately excluded from the first playable stages.

---

# 1. The corrected game identity

## The game to build

> **Weapons of Chaos and Order is a persistent multiplayer medieval strategy RPG in which the player raises a minor House from a frontier outpost into a regional power, builds the economy and army needed to sustain it, masters weapon forging from crude arms to steel masterworks, and eventually discovers runes, risks them in Runeforging, and pursues the creation of Artifacts and Weapons of Order.**

The game begins with wood, stone, ore, food, labor, barracks, walls, ordinary soldiers, and ordinary weapons. It earns its fantasy escalation.

Runeforging is the defining long-term system and the strongest reason to keep playing. It is not the tutorial. The player must first build the settlement, wealth, specialists, military reach, and forging knowledge capable of supporting it.

The core progression is:

1. Establish an outpost.
2. Produce and trade ordinary resources.
3. Construct a barracks, forge, storehouse, and defenses.
4. Recruit, train, and equip companies.
5. Progress from crude and iron equipment to reliable steel.
6. Grow the outpost into a village, fortified town, and regional capital.
7. Discover Runestones and learn how to handle them.
8. Forge rune vessels and attempt Runeforging.
9. Equip notable wielders, build weapon resonance, and attempt higher weapon levels.
10. Create Artifacts and help the world construct Weapons of Order against singular Weapons of Chaos.

## The primary design sentence

> **Build the medieval civilization capable of forging legends.**

War, trade, settlement growth, professions, and armies are not separate games. They create the conditions, materials, demand, deeds, and danger that make the weapon journey meaningful.

## Product hierarchy

The earlier design made the War Council, profession economy, and seasonal Warfront the visible centre. Blacksmithing was one calling among many.

The game follows this hierarchy:

| Priority | System role |
|---|---|
| Primary | Weapon forging, Runeforging, weapon evolution, risk, ownership, and history |
| Required foundation | Settlement growth, resources, buildings, specialists, armies, ordinary equipment, and trade |
| Supporting | Kingdom professions, markets, Situations, logistics, politics, and Warfronts |
| Apex | Artifact creation, singular Chaos crises, and cooperative Weapons of Order |

War remains important because it consumes equipment, creates demand, exposes Runestones, produces historic deeds, and gives weapons a purpose. War is the proving ground for the forge rather than the final identity of the game.

---

# 2. Creative identity

## Locked inspiration hierarchy

1. **The Lord of the Rings:** ancient history, lost knowledge, journeys, culturally distinct peoples, legendary objects, and evil that scars the world.
2. **Game of Thrones:** minor Houses, grounded medieval life, politics, succession, compromise, trade, betrayal, and costly war.
3. **World of Warcraft:** satisfying professions, recognizable material progression, crafting identity, orders, equipment, specializations, and memorable magical escalation.
4. **Age of Empires, Empire Earth, Battle for Middle-earth, and Travian:** settlement growth, resources, asynchronous construction, armies, trade, map pressure, and civilization identity.
5. **Anime:** Aura levels, transformations, signature attacks, exceptional wielders, and L3 forms.

## Tone rule

**Medieval first, Aura second.**

- A timber shortage can delay a fleet.
- A quarry can determine whether a wall survives.
- An iron convoy can decide whether a company is properly armed.
- A master steel blade is prestigious before it ever carries a rune.
- Most soldiers never use Aura.
- L0 is rare and politically valuable even though it has no active power.
- L1 is remarkable.
- L2 is a regional legend.
- L3 is a historical catastrophe or miracle.

The normal interface, world, dialogue, economy, and art should feel grounded. Anime escalation appears when the fiction has earned it.

## Visual direction

**Locked:** high-quality 2D browser presentation with modern Travian-like settlement and map readability.

- Painted regional and world maps.
- Isometric or three-quarter settlement views that visibly evolve by stage.
- Illustrated buildings with construction and damage states.
- Army banners and routes on the map.
- Static or lightly animated company and battalion sprites.
- Detailed illustrations for named smiths, commanders, weapons, runes, and major story moments.
- PixiJS or equivalent for map layers, battle replays, weather, fire, smoke, projectiles, Aura, and corruption.
- A responsive application interface for settlement management, forge projects, markets, armies, reports, and history.

Runtime-generated AI art is not part of gameplay. Approved art is stored with the application at first; an asset manifest can be added when the library becomes large enough to need one. Faction placeholders and heraldic tokens are fallbacks.

---

# 3. Player identity

## Foundation: the player leads a minor House

The player does not begin as a king, legendary smith, or chosen wielder. They lead a minor House authorized to establish or reclaim one outpost inside a kingdom.

The House owns:

- One evolving settlement and stronghold.
- A household, workforce, and named specialists.
- A House forge and its accumulated techniques.
- Companies, officers, and one or more commanders.
- Warehouses, contracts, trade relationships, favors, and debts.
- Equipment batches, named weapons, and eventually Runeforged weapons.
- A crest, motto, reputation, and public history.

The player makes House-level decisions. Named specialists perform the work. This avoids pretending that one character personally mines, farms, builds, forges, commands, heals, and sails.

## Every House participates in the main forge progression

Weaponsmithing is no longer an optional profession that only some players choose.

**Foundation:**

- Every House can construct and improve a weapon forge.
- Every House can employ and train smiths.
- Every House can produce ordinary military equipment.
- Reaching Master Weaponsmith and Runeforger remains difficult.
- Houses may commission a more capable player when their own forge or smith is insufficient.
- A player may become famous by forging for other Houses, Orders, allies, or kingdoms.

Secondary professions create cultural and economic identity, but they do not replace the forge as the shared long-term progression.

## Valid paths to importance

Even with forging at the centre, Houses can become remembered differently:

- The smithing House that created an Artifact.
- The mining House that supplied impossible metal.
- The Sylvaran House that controlled the heartwood needed for elite weapons.
- The Veridorian shipwright that reached an inaccessible Runestone.
- The commander whose deeds awakened a Dormant weapon.
- The merchant that carried a rare rune across enemy territory.
- The Order that assembled the specialists needed for an Order Weapon.
- The traitor that sold steel or runic knowledge to an enemy.

The forge creates the shared aspiration. The route toward it remains social and varied.

---

# 4. The player experience over time

## Chapter I: The Outpost

The player begins with a small claimed site, a House banner, a few workers, a basic hall, and limited supplies.

The first goals are grounded:

- Secure provisions.
- Establish timber, stone, and ore access.
- Build storage.
- Build a barracks.
- Build a basic forge.
- Recruit the first militia or company.
- Produce ordinary weapons.
- Defend a road, convoy, village, or resource site.

There are no active runes in the first playable loop. They may exist in legends, ruined inscriptions, or distant rumors, but the player cannot use them.

## Chapter II: The Settlement

The outpost becomes a stable village and then a fortified settlement.

The player:

- Expands production capacity.
- Builds walls, roads, workshops, housing, and a market.
- Trains specialized kingdom units.
- Moves from improvised or low-grade arms into iron equipment.
- Repairs losses after local conflicts.
- Establishes contracts and trade routes.
- Selects secondary economic specializations.

The player should already understand why a good weapon matters before magic changes the rules.

## Chapter III: Steel and Regional Power

The settlement becomes a fortified town and eventually a regional capital or major House seat. This is not the kingdom capital.

The player:

- Unlocks advanced furnaces, metallurgy, and steel.
- Produces high-quality batches and named weapons.
- Supports larger armies and regional fortifications.
- Trades for materials their kingdom lacks.
- Develops master specialists.
- Participates in wider conflicts and expeditions.
- Encounters credible evidence that Runestones still exist.

Steel is the bridge between ordinary medieval progression and Runeforging. A steel masterwork must feel valuable in its own right.

## Chapter IV: The First Rune

Runes become a playable system only after the player has:

- A capable forge.
- A suitable named weapon or rune vessel.
- A trained smith.
- Secure storage.
- Enough economic resilience to survive failure.
- Access to a discovered, purchased, inherited, or commissioned rune.

The player learns appraisal, vessel preparation, binding risk, and the consequences of failure. Their first success creates an L0 Dormant weapon, not an instant superweapon.

## Chapter V: Enhanced and Artifact

The Dormant weapon must enter the world.

- It is assigned to an eligible named wielder.
- It participates in battles, expeditions, and meaningful Situations.
- The weapon and wielder build resonance.
- Specific deeds satisfy awakening conditions.
- The weapon returns to a qualified Runeforger for a risky awakening or ascension attempt.
- L1 Enhanced permits the Conduit state.
- L2 Artifact permits the staged Aspect transformation.

The smith, wielder, army, settlement, and history all remain necessary. Progression is not only an experience bar.

## Chapter VI: Chaos and Order

Chaos Weapons already exist as singular, soul-bound threats. The long-term civilizational goal is to rediscover and complete the process for Weapons of Order.

No single House produces an Order Weapon from a normal recipe. It is a world project involving legendary smithing, rare materials, multiple kingdoms, scholars, transport, protection, and a resolved moral rule for the living anchor.

---

# 5. What the player does when they log in

## The House Seat

The home experience is the evolving settlement and House Seat. The War Council remains a useful view, but the current Warfront is not always the first thing the player sees.

The opening report answers:

1. What completed while I was away?
2. What needs attention?
3. What can advance my House or forge today?

The player sees:

- Construction and production completed.
- Storage pressure or shortages.
- Recruits trained or wounded recovered.
- Forge projects, repairs, and commissions.
- Market sales, purchases, and caravans.
- Army and patrol outcomes.
- Settlement threats and opportunities.
- Later, rune research, weapon resonance, and Runeforging readiness.

## Daily loop

1. **Review:** inspect reports, settlement state, and urgent needs.
2. **Choose:** select one main objective.
3. **Prepare:** assign specialists, reserve materials, choose troops, or negotiate trade.
4. **Commit:** build, forge, recruit, trade, patrol, explore, repair, or deploy.
5. **Resolve:** receive a visible construction result, craft result, battle replay, or Situation outcome.
6. **Reinvest:** improve the settlement, army, forge, or next weapon project.
7. **Record:** meaningful objects and deeds enter House and world history.

## Session expectations

| Time available | Useful play |
|---|---|
| 2 minutes | Read reports, choose a House priority, start one safe project, and leave. |
| 10 to 20 minutes | Build, forge, trade, equip a company, resolve a Situation, or watch one replay. |
| 30 to 60 minutes | Plan a settlement upgrade, optimize supply chains, prepare an expedition, compare forge risks, or coordinate an Order project. |

There is no global energy bar and no need to collect resources every few minutes. Time is expressed through workforce, specialist capacity, building slots, travel, training, recovery, and project duration.

---

# 6. Settlement growth

## One settlement, visible evolution

The player develops one main settlement rather than spamming many villages.

| Stage | Identity | Main unlocks |
|---|---|---|
| Outpost | Survival and claim | Hall, storehouse, basic production, militia, basic forge |
| Village | Stable local economy | Barracks, market yard, workshop district, roads, housing |
| Fortified town | Regional military power | Walls, armoury, advanced units, trade depot, infirmary |
| Regional capital | Major House seat | Steelworks, master workshops, academy, vault, Order facilities |
| Runic seat | Late-game capability layer | Rune archive, protected forge chamber, resonance hall, containment support |

The last row is not a separate city tier visible to every beginner. It is a late capability layer on the regional capital.

## Buildings unlock decisions

Buildings may have a small number of meaningful tiers, but not thirty levels of percentage increases.

| Building | Capability |
|---|---|
| House Hall | Governance, reputation, visitors, offices, and settlement stage |
| Storehouse | Resource capacity, reservations, and protected inventory |
| Farm or provisioning yard | Provisions and campaign supply |
| Lumber yard | Timber processing and structural components |
| Quarry | Stone and masonry capacity |
| Mine | Ore and special mineral access |
| Forge | Weapons, repairs, named weapons, and later rune vessels |
| Barracks | Recruitment, training, officers, and company capacity |
| Armoury | Equipment storage, loadouts, condition, and repair |
| Walls and watch | Defense, refuge, warnings, and local response |
| Market yard | Contracts, procurement, caravans, taxes, and trade |
| Infirmary | Wounded treatment and specialist recovery |
| Scholar's hall | Archives, appraisal, lost techniques, and later rune knowledge |
| Vault | Named items, rare materials, runes, and dangerous world objects |

Kingdom-specific buildings modify this foundation:

- Sylvaran tree-foundation structures, groves, and heartwood yards.
- Veridorian docks, shipyards, warehouses, and harbor walls.
- Arkazian steelworks, mountain quarries, pass fortifications, and cavalry yards.
- Zandrian deep mines, tunnel works, furnaces, and engineering halls.

## Construction rules

- Common construction is understandable from broad resource families.
- Major upgrades require one or two strategic materials, not twenty ingredients.
- Building time is asynchronous.
- The player can queue only a few major projects, creating priorities.
- A settlement cannot be permanently erased while its owner sleeps.
- Attacks target committed armies, convoys, temporary works, contested sites, or declared regional objectives.

---

# 7. Resources without overload

## Six universal House resources

The grounded game uses:

- Gold
- Provisions
- Timber
- Stone
- Ore
- Workshop Supplies

Workshop Supplies abstract common charcoal, nails, cloth, oils, rope, bindings, containers, ordinary hides, tools, and maintenance inputs.

Stone is included because fortifications, ports, roads, mines, and kingdom construction require it.

## Workforce and capacity are not inventory resources

Workers, specialists, building slots, transport capacity, and storage are capacities. They should not appear as another pile of spendable tokens.

## Material families

Recipes and construction projects ask for broad slots:

- Metal
- Wood
- Stone
- Hide or textile
- Fuel or supplies
- Reagent
- Runic component

Ordinary work uses the universal resources. Specific named materials appear only when they create a meaningful decision.

Examples:

| Project | Visible materials |
|---|---|
| Basic wall | Stone, Timber, Supplies |
| Iron sword batch | Ore, Timber, Supplies |
| Steel sword batch | Refined metal grade, fuel capacity, Supplies |
| Sylvaran bow batch | Timber, Supplies |
| Veridorian ship | Ship timber, Supplies, Stone for dock capacity |
| Named masterwork | Specific metal, grip, technique, treatment |
| Rune vessel | Named masterwork, compatible materials, protective preparation |
| Runeforging | Rune, vessel, catalyst or binder, specialist process |

## Progressive detail

- Beginners see only universal resources and clear shortages.
- A player sees profession-specific materials when they build the relevant capability.
- Rare materials live in a separate, small strategic inventory.
- Market filters default to materials the current project needs.
- The interface never displays the full lore material catalogue at once.

## Production and gathering

Common resources accumulate through buildings and assigned land, calculated from elapsed time. Players do not click trees or rocks repeatedly.

Strategic materials come from:

- Regional control.
- Expeditions.
- Contracts.
- Trade.
- Salvage.
- Specialist gathering operations.
- Rare world Situations.

Gathering can be a specialization and a trade identity. It is not mandatory busywork for every smith.

## Regional abundance and interdependence

Every kingdom can obtain basic materials, but geography changes cost, abundance, and mastery.

- Arkazia has strong ore and stone, but can depend on foreign timber and specialist organic materials.
- Sylvara has exceptional timber, hides, food, and herbs, but imports heavy metal and fortress stone.
- Veridor consumes large quantities of timber and stone for ships, docks, roads, and fortifications; commerce gives it access rather than self-sufficiency.
- Zandres is a major source of ore, stone, crystals, sulfur, and engineering knowledge.

Basic play must remain possible during blockade. High-tier efficiency and legendary projects create the real dependency.

---

# 8. The forge: the main system

## The forge loop

> **Acquire materials â†’ choose a weapon and method â†’ forge â†’ sell, supply, retain, or equip â†’ use the weapon â†’ repair or reforge â†’ build mastery and history.**

This loop exists from the first ordinary spear to the final Order project.

## Four scales of weapon creation

### Military equipment batches

A batch equips a company without creating hundreds of individual inventory records.

Example:

> 100 Arkazian infantry swords  
> Metal grade: iron  
> Quality: serviceable  
> Condition: 100%  
> Maker: House Pires

### Named weapons

Commanders, officers, champions, and specialists can own individual weapons with materials, maker marks, owners, repairs, scars, and deeds.

### Runeforged weapons

One named vessel receives one final rune identity and progresses through L0, L1, and L2.

### Chaos and Order Weapons

Singular world objects capable of L3. They are never mass-produced inventory.

## Ordinary forging decisions

Every meaningful forge project chooses a controlled set of variables:

1. Weapon pattern and intended user.
2. Batch or named item.
3. Material grade.
4. Technique or design emphasis.
5. Assigned smith.
6. Destination.

Ordinary forging uses transparent calculations and a guaranteed result floor. A player should not lose ordinary client materials to hidden random quality.

## Material progression

The exact balance remains open, but the conceptual ladder is:

1. Improvised wood, stone, salvaged metal, and simple militia equipment.
2. Bronze or low-grade iron where culturally appropriate.
3. Reliable iron military equipment.
4. Tempered and standardized equipment.
5. Steel weapons and plate-grade production.
6. Named masterworks using rare materials and advanced techniques.
7. Rune vessels.

This is not a universal linear replacement. Bows, leather, shields, polearms, and kingdom techniques remain useful. Steel represents economic and technical maturity, not a reason to delete cultural equipment.

## Blacksmith mastery

**Foundation:**

1. Apprentice: repairs and simple batches.
2. Weaponsmith: reliable military batches and material choice.
3. Master Weaponsmith: steel, named weapons, custom techniques, and commissions.
4. Vessel Smith: constructs weapons capable of accepting a rune.
5. Runeforger: performs L0 binding and L1 awakening work.
6. Legendary Runeforger: attempts Artifact ascension, extraction, fusion, and world projects.

Mastery comes from varied meaningful work, discoveries, mentors, techniques, and successful projects. It must not require producing thousands of useless daggers.

## Destinations

After forging, the player can:

- Equip their own company or named wielder.
- Complete a kingdom military contract.
- Sell on a regional market.
- Fulfill a direct player commission.
- Supply an Order warehouse or project.
- Export to an allied kingdom.
- Retain it for later use.
- Illicitly sell it to an enemy, with political risk.

The chosen destination must be exclusive. The same object cannot be equipped, sold, and delivered at once.

---

# 9. Runes and Runeforging

## Canon rules

- Runes exist naturally as Runestones.
- Chaos and Order are the only crafted rune principles.
- Chaos and Order do not function alone.
- One final rune identity defines a Runeforged weapon.
- Compatible inputs may fuse during Runeforging, but the result is one identity such as Lightning, Blood, or Psychic.
- L0 is Dormant.
- L1 weapon is Enhanced; its active state is Conduit.
- L2 weapon is Artifact; its active transformation is Aspect.
- L3 is Dreadform or Ascendant and requires Chaos or Order fusion.

## Rune categories in the game economy

### Discoverable runes

Material, ordinary Animal, Elemental, Nature, and Physical runes can enter the world through Runestones, expeditions, ancient sites, trade, inheritance, and world events.

Their exact replenishment and rarity rates are open.

### Fused runes

Compatible rune inputs can fuse into a new final identity during a high-risk forge process. Elemental examples include Lightning, Ice, Steam, Sand, Mud, and Lava.

### Singular runes

Primal runes, Mystic runes, and Mythical creature runes are currently unique according to canon.

**Foundation:** singular runes cannot be permanently destroyed by an ordinary failed forge attempt. Failure can still:

- Destroy or scar the vessel.
- Injure or disable the smith.
- Consume catalysts and preparation.
- Force the rune into a dormant recovery period.
- Cause the rune to reject the House or intended wielder.
- Expose, displace, capture, or lose the rune through a follow-up Situation.

This preserves real consequence without deleting a canonical one-of-a-kind object from the world through an unlucky roll.

### Crafted Chaos and Order

These are artificial reaction principles fused with another rune. They are not independent weapons or ordinary inventory. Chaos Weapons are pre-existing singular objects. Creating Order is a late world objective.

## The Runeforging project

A Runeforging attempt requires:

- A qualified named vessel.
- A rune or approved compatible input combination.
- A smith with the required technique.
- A forge with the required capability.
- Preparation, binders, catalysts, or safeguards.
- An intended result.
- For later stages, an eligible wielder and fulfilled history conditions.

Before confirmation, the interface must display:

- Success chance.
- Rune-survival chance on failure.
- Vessel-survival chance.
- Possible failure classes.
- Which inputs are consumed regardless of outcome.
- Which preparation can improve the odds.
- Why each probability has its value.

No paid protection, hidden modifier, or retry reroll is allowed.

## Failure ladder

**Foundation model to test:**

1. **Clean success:** intended state achieved.
2. **Scarred success:** state achieved, but the item records a flaw, cost, or harder future path.
3. **Rejection:** no advancement; rune survives; vessel is damaged or preparation is lost.
4. **Fracture:** destructible rune shatters; vessel may survive as a Broken Relic.
5. **Catastrophe:** vessel is destroyed or permanently scarred; specialists may be injured; the settlement receives a Situation.

The exact probabilities are balance data, not canon.

Failure must still produce knowledge, history, or mastery evidence. It must hurt, but not feel as if the game deleted hours without acknowledging them.

## Retry integrity

The server determines one immutable result for one confirmed attempt. Network retries cannot generate a new roll. Cancelling after seeing an outcome is impossible. The attempt records the formula version, probability snapshot, inputs, seed reference, result, and consequences.

This is essential for fairness, support, and multiplayer commissions.

---

# 10. Weapon evolution

## L0: Dormant

The rune is successfully inscribed or bound, but the weapon has no active Aura power.

L0 is still valuable because:

- The rune survived the forge.
- The weapon has a unique identity.
- The intended wielder can begin bonding.
- The item starts accumulating history and resonance.
- Rivals may want to buy, steal, study, or destroy it.

## L1: Enhanced and Conduit

**Foundation progression:**

1. The L0 weapon is assigned to a named eligible wielder.
2. Use, training, Situations, and battles build resonance.
3. A rune-specific awakening condition is met.
4. The weapon returns to a qualified Runeforger.
5. An awakening attempt is made with transparent risk.
6. Success creates an L1 Enhanced weapon.
7. The wielder can enter the Conduit state and channel the rune through the weapon.

This keeps both deeds and forging necessary.

## L2: Artifact and Aspect

L2 requires:

- A mature L1 bond.
- Exceptional rune-specific deeds.
- A named catalyst, discovery, or technique.
- A Legendary Runeforger.
- A dangerous ascension attempt.

Success creates an Artifact. The wielder gradually masters 25%, 50%, 75%, and 100% Aspect expression as defined by the Aura canon.

An Artifact is not a market recipe that a wealthy player can order instantly.

## L3: Dreadform and Ascendant

Only a rune fused with Chaos or Order can reach L3.

- Chaos uses a soul-bound living weapon and creates Dreadform.
- Order is a constructed counter and creates Ascendant.
- The canon contradiction about Order soul entrapment remains open.
- L3 is a world event, not normal personal progression.

## Example: a Fire weapon journey

1. A House reaches steel and forges a named longsword.
2. An expedition discovers a Fire Runestone.
3. A scholar appraises it and a Vessel Smith prepares the blade.
4. The player chooses safeguards, accepts the visible risk, and attempts L0 binding.
5. If successful, the Dormant Fire weapon is assigned to a named officer.
6. It survives a settlement fire or wins a battle where fire would normally consume the wielder.
7. Its resonance and deed unlock an L1 awakening attempt.
8. Later, a landmark deed and legendary reforge may create an L2 Fire Artifact.

The game should make the player remember the whole chain, not only the final stat.

---

# 11. Equipment, armies, and battles

## Equipment scale

- Equipment batches arm ordinary companies.
- Named weapons belong to officers, commanders, specialists, or champions.
- Runeforged weapons belong to named wielders.
- A battalion does not receive one hundred identical Fire Runes.

This preserves rarity and prevents Aura from replacing medieval warfare.

## Army structure

- A company contains approximately 50 to 150 soldiers.
- Several companies can form a battalion.
- Companies track role, training, morale, fatigue, wounds, officers, and equipment.
- Battalions are the main simulation entities for larger battles.
- The renderer shows representative sprites rather than every soldier.

## What the player controls

Before battle:

- Company and battalion selection.
- Equipment and condition.
- Frontline, flank, reserve, and commander positions.
- Formation depth.
- Target priorities.
- Aggression, cohesion, and retreat threshold.
- Terrain approach.
- Supply.
- Later, named wielder and Aura activation rules.

Combat resolves automatically and authoritatively. The player watches a replay and receives an explanation.

## The role of forged equipment

Forged equipment must visibly matter without producing unbounded stat inflation.

- Better swords improve reliability, penetration, or formation performance.
- Better armor changes casualty and recovery profiles.
- Condition and partial equipment matter.
- A named masterwork can influence an officer duel or morale event.
- A Runeforged wielder creates a rare tactical event, not a permanent screen-wide explosion.

The post-battle report identifies which equipment and preparation choices mattered.

## Loss and economic demand

Soldiers may be killed, wounded, captured, missing, scattered, or recovered.

Equipment may remain serviceable, become damaged, be salvageable, be captured, or be lost.

Ordinary goods leave the economy through wear, repair, loss, construction, and deployment. Named and Runeforged items should usually create a recovery story rather than silently vanish. They may be damaged, captured, lost, reclaimed, reforged, or permanently scarred.

---

# 12. Secondary professions and kingdom economies

## Rule

Secondary professions develop the settlement, supply the forge and army, and create trade dependencies. They do not all receive rune variants.

There are no runic ships, rune-infused lumber camps, or mandatory Aura versions of every profession in the core design. Runes remain concentrated in weapons and their supporting scholarship.

## Access structure

- Every House has basic access to common settlement services.
- A House can deeply specialize in a limited number of secondary fields.
- Some advanced branches are native or exclusive to a kingdom.
- Foreign goods and services are obtained through markets, commissions, alliances, apprenticeships, or captured knowledge.
- No kingdom becomes unable to complete basic play because another population is offline.

## Kingdom foundations

| Kingdom | Resource and profession identity | Settlement and war contribution |
|---|---|---|
| Arkazia | Mining, quarrying, metallurgy, masonry, plate and standardized arms | Steel, walls, pass fortifications, heavy equipment, cavalry infrastructure |
| Sylvara | Forestry, heartwood, skinning, leatherwork, herbs, beast husbandry | Tree foundations, bows, wood armor, medicine, scouts, mounts |
| Veridor | Shipbuilding, navigation, sailmaking, warehousing, trade logistics | Ships, ports, convoy capacity, naval access, roads, commercial reach |
| Nordalh | Hunting, furs, timber, charcoal, cold-weather provisioning, cold tempering | Winter supply, durable arms, northern transport, clan equipment |
| Draxys | Water engineering, venom harvesting, leatherwork, desert husbandry | Oasis capacity, poison supply, desert gear, beast and scorpion units |
| Lumus | Agriculture, healing, disciplined schools, fine stonework, civic institutions | Recovery, stable provisioning, trained specialists, clean fortifications |
| Zandres | Deep mining, quarrying, furnaces, tunneling, siege engineering | Ore, crystals, sulfur, vault parts, siege works, underground routes |

These are foundations, not complete profession designs. Each addition must be validated as a meaningful loop rather than a new timer.

## Concrete dependency examples

- A Veridorian shipyard requires large quantities of timber and stone. Sylvara may supply superior ship timber; Arkazia or Zandres may supply stone fittings and metal.
- A Sylvaran tree settlement consumes timber, specialist woodworking, hides, and limited imported metal. Heavy stone foundations are less central, but roads and border defenses still need stone.
- Arkazian fortifications consume stone and steel while the forge competes for ore and fuel capacity.
- A Runeforger may require a Veridorian expedition to reach an island Runestone, Sylvaran materials for a grip, and Zandrian metal for the vessel.

The dependency should create a choice and relationship, not a shopping list.

---

# 13. Economy and market

## Economic loop

> Settlement demand creates work. War consumes goods. Trade moves shortages. Forging transforms materials. Better weapons unlock riskier opportunities. Rune failures and repairs create high-level sinks.

## Demand layers

1. **House demand:** construction, troops, equipment, repair, food, and projects.
2. **Player demand:** markets, commissions, direct trade, and Order supply.
3. **World demand:** settlements, NPC Houses, kingdom quartermasters, garrisons, fleets, refugees, and Warfronts.

World demand is bounded by budgets, stockpiles, deadlines, and actual world state. There is no infinite vendor buying every sword.

## Markets

- One main regional market per kingdom at first.
- Trade routes, caravans, ports, tariffs, risk, and travel time.
- Direct player commissions.
- Public, House-to-House, Order-only, allied, and kingdom contracts.
- Later, illicit cross-border trade and smuggling.

## Crafting and Runeforging commissions

An ordinary commission states:

- Pattern and quantity.
- Required minimum quality.
- Provided and missing materials.
- Fee, deadline, and destination.

A Runeforging commission additionally states:

- Who owns the vessel and rune.
- Who supplies safeguards and catalysts.
- Exact risk disclosure.
- Which losses each party accepts.
- What happens on each failure class.
- Who owns the resulting weapon.
- How fees change by outcome.

Both parties must accept the risk contract before the attempt becomes immutable.

## Sinks and inflation controls

- Construction.
- Equipment wear, repair, damage, capture, and controlled loss.
- Deployment provisions.
- Wages and specialist recovery.
- Transport, market, insurance, customs, and smuggling costs.
- Forge fuel and preparation.
- Named material consumption.
- Failed Runeforging attempts.
- Settlement maintenance at higher capability, without punitive decay.

The game must track gold and goods created, moved, consumed, damaged, repaired, and destroyed from the first prototype.

---

# 14. Situations, narrative, and history

## Situations

A Situation is a short problem generated from House and world state.

It can involve:

- A missing resource convoy.
- A collapsed mine.
- A timber dispute.
- A damaged wall.
- Deserters or wounded soldiers.
- A commission from a rival.
- Evidence of a Runestone.
- A smith injured during failure.
- A rune rejecting its wielder.
- A stolen named weapon.

Choices can use settlement capabilities, specialists, armies, profession knowledge, gold, relationships, or previous history.

## History is a system

Important records include:

- Settlement stage and major construction.
- Smiths and learned techniques.
- Equipment batch maker marks.
- Named weapon owners and repairs.
- Rune discovery and custody.
- Every Runeforging attempt, including failure.
- Weapon awakenings and Aspect milestones.
- Battles and deeds.
- Captures, thefts, recoveries, and reforging.
- Chaos and Order custody.

Example:

> Forged by House Pires in the third furnace of Ashen Hold. Bound to a Fire Rune after two failed preparations. Carried by Theron Vale. Awakened during the Defence of Cinder Road.

Failure becomes part of identity instead of disappearing into an error message.

---

# 15. Multiplayer, Orders, Warfronts, and seasons

## Primarily asynchronous multiplayer

Players can contribute without being online together:

- Sell and commission materials or weapons.
- Reinforce allies.
- Supply depots and fleets.
- Join expeditions.
- Contribute specialists to projects.
- Pledge companies and standing orders.
- Vote on custody and crisis decisions.

## Orders

Orders are guilds of Houses. Their strongest role is coordinating what one House cannot do alone:

- Large construction.
- Trade convoys.
- Regional expeditions.
- Defense and recovery.
- Artifact protection.
- Chaos containment.
- Order Weapon research and construction.

Order offices may include Marshal, Quartermaster, Master of Works, Spymaster, and Diplomat, but the first implementation remains small.

## Warfronts

Warfronts are temporary contested regional conflicts.

They:

- Create equipment and supply demand.
- Damage or consume goods.
- Open and close routes.
- Reveal expeditions and Runestones.
- Create deeds required by weapons.
- Change settlement threats and opportunities.
- Generate public history.

They do not erase the permanent settlement or become the only source of progression.

## Seasons

**Locked:** persistent accounts with seasonal conflict and no full account wipes.

Permanent:

- House and settlement.
- Specialists and forge mastery.
- Buildings and secondary profession capability.
- Army roster and doctrine.
- Named and Runeforged weapons.
- Relationships, titles, and history.

Seasonal:

- Active contested regions.
- Warfront influence and temporary depots.
- Crisis knowledge and special objectives.
- Rankings and political offices.
- Active Chaos or Order storyline.

New players progress through the permanent medieval-to-rune journey regardless of season. Seasonal content must offer tasks for outposts, developed towns, and rune-capable Houses.

---

# 16. Chaos and Order

## Chaos Weapons

**Locked:** Chaos Weapons are unique, rare, soul-bound beings created by the Thalori. They speak, promise power, corrupt, consume, damage their wielders, scar the world, and can reach Dreadform.

In game:

- There is one canonical instance of each.
- They never drop as ordinary loot.
- Location, custody, bearer, condition, corruption, and history are world state.
- Every activation has a personal and regional cost.
- They cannot be duplicated by retries, seasons, or multiple servers pretending to share one canon.
- A bearer receives power and political danger, not permanent ownership as a normal reward.

Every Chaos Weapon needs:

1. Promise.
2. Appetite.
3. Price.
4. Possession.
5. Scar.

## Weapons of Order

**Foundation:** Order Weapons are constructed counters.

They should:

- Stabilize runaway Aura.
- Expose or weaken the bond between Chaos weapon and bearer.
- Contain corruption.
- Prevent consumption or regeneration.
- Create an opening for armies and Artifact wielders.
- Seal, separate, or imprison the Chaos Weapon.

Creating one is the ultimate cooperative forge project. It uses the systems the player learned from outpost construction onward.

## Open soul rule

The source files conflict:

- Order Weapons contain no trapped soul.
- L3 requires Soul Entrapment for both Chaos and Order.

Recommended but not locked:

> L3 requires a living anchor. Chaos traps a soul inside the weapon. Order uses a consenting living bearer whose soul remains in the body.

Possible excessive Order consequence: Fixation, the gradual loss of flexibility, emotion, and free choice to a single perfect purpose.

---

# 17. Pacing and onboarding contract

## Do not reveal the main system too late

Runeforging must be earned, but the game cannot look like a generic medieval builder for months.

**Foundation target to test:**

- First session: establish the outpost, build the basic forge, recruit and equip the first company.
- First several meaningful sessions: reach reliable iron, understand trade and equipment loss, and see evidence of runes.
- Early progression milestone: unlock steel or a named vessel and begin the first Runestone chain.
- First major account milestone: attempt L0 Runeforging.

The exact number of real days is open and must be playtested. Progress should depend on decisions and milestones more than constant check-ins.

## Foreshadowing

Before playable runes, the world can show:

- Legends of Akron Wright and the Thalori.
- Old rune scars on ruins.
- A broken inscription no current smith understands.
- A kingdom restriction on relic trade.
- A distant Aura event in a Chronicle.

Foreshadowing creates aspiration without giving the tutorial a Fire sword.

---

# 18. First two validation slices

## Slice A: Foundations of Iron

**Purpose:** prove that the grounded beginning is satisfying and that ordinary weapons matter.

Scope:

- One Arkazian outpost near a Sylvaran border.
- One evolving settlement view.
- Gold, Provisions, Timber, Stone, Ore, and Workshop Supplies.
- Hall, storehouse, basic production, barracks, forge, armoury, and simple walls.
- One named smith.
- One Arkazian Bastion company.
- One 100-sword iron batch.
- One choice to equip, sell, or fulfill a contract.
- One local conflict and deterministic replay.
- Equipment damage, repair, payment, and history.
- Sylvaran timber pressure and Arkazian ore/stone abundance.

Questions:

1. Is building the first settlement capability understandable?
2. Does forging feel like an active decision rather than a timer?
3. Does the player care where the weapon batch goes?
4. Can the player explain how equipment changed the battle?
5. Does the first session feel medieval rather than like an admin dashboard?

## Slice B: First Flame

**Purpose:** prove the distinctive Runeforging promise before building large multiplayer systems.

Scope:

- Accelerated but coherent progression from iron to steel.
- One named steel vessel.
- One Fire Runestone discovery chain.
- Appraisal and secure storage.
- One L0 Runeforging attempt with visible odds and at least three failure classes.
- Destructible-rune behavior.
- Assignment to one named officer on success.
- Weapon resonance and one deed.
- One accelerated L1 awakening attempt.
- A controlled prototype of the L2 Artifact attempt for risk and comprehension testing, even if L2 is not reachable in normal slice pacing.
- Full attempt and weapon history.

Questions:

1. Is the rune valuable before it grants combat power?
2. Does the player understand and accept the risk?
3. Are failure and destruction painful but narratively meaningful?
4. Does preparation create interesting decisions?
5. Does the player want to attempt another weapon journey?
6. Does the L1 Aura moment feel exceptional after the grounded opening?

Do not move to a 20-player Warfront merely because Slice A works. The product identity is not proven until Slice B also works.

---

# 19. Technical foundation

## Minimal recommended baseline

Begin with the smallest stack that can prove the game:

- One ASP.NET Core modular-monolith application.
- Feature folders inside that application rather than many projects or services.
- One EF Core `DbContext` and PostgreSQL database.
- React, TypeScript, and Vite for the web client.
- One automated test project, expanded only when a real need appears.
- Docker Compose for PostgreSQL only.
- GitHub Actions for build and tests.
- Basic structured application logs.
- Static art and content stored with the application at first.

The ASP.NET Core process owns the API and, when gameplay needs it, small in-process background tasks. Elapsed-time systems should prefer storing timestamps and calculating progress when state is read or changed. A separate worker is introduced only after measured work can no longer be handled safely in the application process.

PixiJS is added when the first battle replay or map genuinely needs it. Azure deployment, Blob Storage, distributed job processing, and deeper observability are later operational steps, not requirements for the first platform.

The project owner has strong C#/.NET experience and access to Azure for Students. When deployment is justified, use a small cost-capped Azure setup and keep the application portable. Local development must not require Azure or another paid service.

## Modular boundaries

Start with feature folders for only the first playable slice:

- Houses.
- Settlements.
- Resources.
- Forge.
- Armies.
- Battles.

Add Contracts, Markets, Situations, Runes, Orders, Warfronts, History, and other areas when their prompt makes them playable. Future systems should influence naming and obvious extension points, but they do not need projects, tables, services, or empty abstractions before use.

## Critical technical invariants

- The server is authoritative for resources, time, forge outcomes, battle outcomes, and world state.
- Gold and goods movements are transactional and ledgered.
- A weapon or batch has one exclusive state and owner at a time.
- A Runeforging attempt produces one immutable outcome under retries.
- A destructible rune cannot be destroyed twice.
- A singular rune or Chaos Weapon cannot be duplicated or permanently destroyed by an invalid path.
- Battle simulation is deterministic from explicit inputs, rules version, and seed.
- Replay rendering never calculates the outcome.
- Active content remains resolvable after content updates.
- Permanent state and seasonal state are separated.

## Do not use initially

- A separate worker process.
- A transactional outbox or general-purpose job platform.
- Object storage or an asset service.
- An OpenTelemetry stack.
- Multiple `DbContext` instances or database schemas by feature.
- Detailed cloud infrastructure or deployment automation.
- Microservices.
- Kubernetes.
- Redis or a message broker without measured need.
- Real-time combat.
- Blockchain or public ownership tokens.
- Runtime AI-generated content or art.
- Paid cloud dependencies for local development.

---

# 20. Research principles

The research lessons support the corrected hierarchy.

| Reference | Principle retained |
|---|---|
| Torn | Persistent identity, economy integrity, factions, and public history |
| Travian | Asynchronous construction, trade, alliances, and shared objectives |
| Albion Online | Player-crafted equipment needs consumption and loss |
| EVE Online | Production, destruction, concentration, and inflation require telemetry |
| World of Warcraft | Professions need identity, orders, specialization, and recognizable outputs |
| Foxhole | Logistics matters when impact is visible, but becomes harmful when it resembles mandatory work |
| Fallen London | Reusable state-driven Situations can create personal stories sustainably |
| Stronghold and Age of Empires traditions | Settlement growth and military production provide a readable grounded foundation |

Retained warnings:

- Do not require overnight defense.
- Do not overwhelm beginners with materials.
- Do not make late crafters permanently irrelevant.
- Do not let veterans monopolize every market.
- Do not rely on a player market before population exists.
- Do not let equipment accumulate without sinks.
- Do not make Runeforging failure a paid protection funnel.
- Do not mistake more content for a proven loop.

The curated links and videos from the earlier research remain useful as a separate appendix and do not need to be duplicated here.

---

# 21. Ethical product and monetization

- Never sell forge success chance.
- Never sell rune protection.
- Never sell rare materials, combat power, building power, queue priority, or extra Warfront strength.
- Never offer a paid reroll after a failed attempt.
- Never use loot boxes for runes or equipment.
- Never sell relief from intentionally painful timers.
- Seasonal rankings cannot be influenced by spending.

Closed testing begins without monetization. Possible later revenue remains cosmetic or patronage-based: heraldry, settlement themes, portrait treatments, history presentation, replay presentation, and fixed-content cosmetic packs.

---

# 22. Main risks and controls

| Risk | Why it matters | Control |
|---|---|---|
| The game feels like a Travian clone before runes | The distinctive promise arrives too late | Strong foreshadowing and an early milestone path to the first L0 attempt |
| Runes arrive too early | Medieval weapons and settlement growth become irrelevant | Require forge, vessel, smith, storage, wealth, and military experience |
| Runeforging RNG feels abusive | Destruction can erase trust | Exact odds, player-controlled preparation, immutable rolls, meaningful failure history, no monetized protection |
| Forging becomes menu paperwork | The primary system lacks emotion | Visible materials, named smiths, process choices, consequences, history, and battle use |
| Secondary professions dilute the game | Many shallow systems create scope and chores | Add one profession branch at a time only when it feeds settlement, forge, army, or access |
| Resource overload | Lore richness becomes inventory management | Six universal resources, contextual strategic materials, family slots |
| All players become identical smiths | Shared forge path removes identity | Named smiths, techniques, maker reputation, secondary specializations, kingdoms, commissions, doctrine |
| Unique runes are lost to chance | Canonical content disappears randomly | Singular runes cannot be destroyed by ordinary failure; use other severe consequences |
| Veteran monopoly | Old Runeforgers control all progression | Useful self-forging baseline, commission competition, catch-up, technique diffusion, bounded advantages |
| Dead early market | Too few players create liquidity | Bounded NPC demand, House demand, kingdom contracts, simulated Houses |
| Scope explosion | Settlement, economy, battles, runes, seven kingdoms, and seasons are too much | Two validation slices, one kingdom border, one weapon family, one rune |
| War overwhelms the forge identity | Rankings become the only goal | War supplies demand and deeds; forge and weapon history remain the permanent centre |
| Offline punishment | Adult players leave | Safe permanent settlement, declared risk, warnings, standing orders |
| Pay-to-win distrust | Paid odds corrupt the core fantasy | Cosmetic-only foundation and no paid efficiency |

---

# 23. Canon consistency register

These source conflicts remain open:

1. Victura uses Necrosis in one file and Necro in others.
2. Vantashields uses Metorite or Meteorite in one source and Tarnish in the Aura source.
3. Ruincoils uses Entropy, which is absent from the Corrupted Rune list.
4. Order contains no soul in one source, while L3 Soul Entrapment requires a living soul in another.
5. L1 uses Enhanced and Conduit; L2 uses Artifact and Aspect. Recommended resolution: weapon name versus active state.
6. Fused elements and Chaos or Order combinations must resolve into one final rune identity before the one-rune-per-weapon rule is applied.
7. The exact physical process and material requirements for Chaos and Order remain incomplete.
8. Which discoverable rune families are renewable after destruction remains open.
9. Whether all singular Mythical runes are indestructible in the same way as Mystic and Primal runes needs explicit canon approval.

---

# 24. Locked, Foundation, Open, and Later register

## Locked

- Medieval settlement, resources, buildings, armies, and ordinary weapons come first.
- The settlement evolves from outpost toward a capital-scale House seat.
- The player becomes wealthier and unlocks better ordinary materials, including steel.
- Forging and Runeforging are the main long-term goal.
- Runes arrive after the grounded foundation.
- Runeforging can fail and destructible runes can be destroyed.
- Unique runes require protection from ordinary permanent destruction.
- Weapons can be sold, supplied, retained, or equipped.
- Secondary professions support settlement and war.
- Kingdoms have different resource and profession identities.
- Secondary systems such as shipbuilding do not all use runes.
- Resources require variety without overwhelming the player.
- Chaos Weapons are singular, living, corruptive, and self-destructive.
- Weapons of Order are created later as counters.
- The world is persistent and seasonal without full account wipes.
- Battles are battalion-level autobattles with representative sprites.
- Medieval fantasy is visually primary; Aura escalation is exceptional.

## Foundation

- The player leads one minor House and one evolving settlement.
- Every House can progress its forge; advanced players can commission specialists.
- Six universal resources: Gold, Provisions, Timber, Stone, Ore, and Workshop Supplies.
- Ordinary forging has a guaranteed result floor; explicit destructive chance begins with Runeforging.
- L0 binding, L1 awakening, and L2 ascension all require the forge.
- Deeds and weapon-wielder resonance gate L1 and L2 attempts.
- Singular Mystic, Primal, and approved Mythical runes cannot be destroyed by ordinary failed attempts.
- The first two validation slices are Foundations of Iron and First Flame.
- The first border remains Arkazia versus Sylvara.
- Warfronts support the forge loop rather than replace it.
- One ASP.NET Core modular monolith, React, TypeScript, Vite, PostgreSQL, EF Core, a small test setup, and Docker Compose for PostgreSQL are the preferred starting baseline.

## Open

1. Exact settlement stages, names, and pace.
2. How soon normal players reach their first L0 attempt.
3. Exact forging and Runeforging probabilities.
4. Which preparations modify rune survival, vessel survival, and success.
5. Whether an L2 failure can permanently destroy the named vessel.
6. How standard Runestones re-enter the persistent world after destruction.
7. Whether every Mythical rune is indestructible.
8. The full Order living-anchor and Fixation rule.
9. Whether a House can defect or change kingdom.
10. How often named weapons can be captured or permanently lost.
11. The exact number and depth of secondary profession specializations.
12. Whether a player character is also a visible smith or only the House leader employing smiths.
13. How much control remains after an autobattle starts.
14. Final commercial model.

## Later

- All seven kingdoms as complete playable economies.
- Many simultaneous secondary professions.
- Naval battles.
- Technic Runes.
- Full L3 playable transformations.
- Public-scale seasons.
- Complex kingdom elections and diplomacy.
- Runtime AI content.
- Monetization.

---

# 25. Immediate next implementation task

The next session should use this workbase and the implementation prompt pack.

Prompt 2 must create only the minimal empty platform:

- One ASP.NET Core application.
- One React, TypeScript, and Vite client.
- PostgreSQL through Docker Compose.
- EF Core connectivity and one simple API endpoint.
- One small automated test setup.
- GitHub Actions for build and tests.

It must also simplify any earlier architecture documentation that prescribes a separate worker, outbox, object storage, extensive cloud operations, or other infrastructure that the first playable slice does not need.

After the platform works, implementation begins with the grounded medieval foundation. It does not begin by forging a Fire Artifact. It also does not postpone Runeforging until after a large MMO has been built.

---

# Final product statement

> **Raise an outpost into a capital. Feed its people, build its walls, train its army, and learn to forge weapons worth carrying. Trade for what your kingdom lacks. Arm soldiers and watch their equipment change the course of battle. Then discover the runes hidden beneath Bellum, risk them in the forge, awaken weapons through historic deeds, and pursue Artifacts powerful enough to stand against living Weapons of Chaos.**