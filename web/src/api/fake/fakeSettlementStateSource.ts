import { goldPerMissingUnit } from '../procurement.ts';
import type {
  AttentionItem,
  Building,
  BuildingKind,
  ChangeEntry,
  CraftOrder,
  Destination,
  EquipmentBatch,
  ForgeCraft,
  ForgeState,
  ResourceBalance,
  ResourceCostEntry,
  ResourceKind,
  SettlementState,
  SettlementStateSource,
  SmithOption,
} from '../types.ts';
import { CommandRejection, resourceOrder } from '../types.ts';
import { FakeClock } from './clock.ts';
import {
  buildingDefinitions,
  contentVersion,
  craftCostOf,
  craftDurationOf,
  grades,
  kingdomRequest,
  listingAskingPriceGold,
  openingBalances,
  patterns,
  resourceDisplayNames,
  rulesVersion,
  smithAwayReason,
  smithId,
  smithMastery,
  smithName,
  smithRoster,
  techniqueDefinitionOf,
  techniqueOptions,
} from './content.ts';

/**
 * The scenarios the mock ships. They are distinct opening positions, not one
 * state mutating into the other.
 *
 * - `firstSession` — nothing built. The Lumber Yard is available, and raising
 *   it is the single primary action.
 * - `returningConstruction` — the Lumber Yard is already under construction and
 *   due shortly, so the development time control can carry it to completion and
 *   the settlement view can be seen to change.
 * - `empty` — a settlement nobody has taken service at yet.
 * - `smithUnavailable` — the Forge stands, nothing has been forged, and the one
 *   smith cannot take the work. The unavailable-specialist case, primed rather
 *   than reached by crafting: a smith who is busy on a craft only ever proves
 *   that a second craft is refused, which is a different rule.
 */
export type Scenario =
  | 'firstSession'
  | 'returningConstruction'
  | 'empty'
  | 'smithUnavailable';

const startOfSession = new Date('2026-08-03T12:00:00Z');

/** What the source holds between calls. Commands change it; `load` reads it. */
interface Construction {
  status: 'NotBuilt' | 'UnderConstruction' | 'Complete';
  startedAt: Date | null;
  completesAt: Date | null;
}

/**
 * The one craft, as the source keeps it.
 *
 * Flatter than the {@link ForgeCraft} the seam publishes — the union is how the
 * *contract* stops a caller holding an impossible craft, and this is the mutable
 * record the transitions walk. {@link FakeSettlementStateSource.craftView}
 * converts one into the other, and is the only place that mapping happens.
 */
interface CraftRecord {
  id: string;
  status: 'InProgress' | 'AwaitingDestination' | 'Settled';
  order: CraftOrder;
  cost: readonly ResourceCostEntry[];
  durationMinutes: number;
  qualityFloor: 'Serviceable' | 'Fine';
  startedAt: Date;
  completesAt: Date;
  batch: EquipmentBatch | null;
  destination: Destination | null;
  destinationChosenAt: Date | null;
  /** Set only where the destination moved or quoted Gold. */
  feePaidGold: number | null;
  askingPriceGold: number | null;
}

/**
 * A fake source over an in-memory settlement.
 *
 * It is **stateful**: commands spend balances and start work, and `load`
 * resolves elapsed time on read — anything now due becomes complete and records
 * a change. That is deliberately the same shape as a real endpoint, where
 * progress is stored timestamps read on demand rather than a timer.
 *
 * Time only moves when {@link advance} is called, so every test that involves
 * duration is deterministic.
 */
export class FakeSettlementStateSource implements SettlementStateSource {
  private readonly clock: FakeClock;
  private readonly scenario: Scenario;
  private readonly latencyMs: number;

  private readonly balances = new Map<ResourceKind, number>();
  private readonly constructions = new Map<BuildingKind, Construction>();
  private readonly changes: ChangeEntry[] = [];

  /**
   * At most one craft, and it is never replaced.
   *
   * A second project would overwrite this record, and with it the batch's
   * provenance and the destination the player chose — the two things later
   * systems read. Repeat crafting needs somewhere to keep more than one, which
   * is authoritative forging's job, not a mock's.
   */
  private craft: CraftRecord | null = null;

  private nextChangeId = 1;

  constructor(scenario: Scenario = 'firstSession', latencyMs = 0) {
    this.scenario = scenario;
    this.latencyMs = latencyMs;
    this.clock = new FakeClock(startOfSession);

    for (const kind of resourceOrder) {
      this.balances.set(kind, openingBalances[kind]);
    }

    for (const definition of buildingDefinitions) {
      this.constructions.set(definition.kind, {
        status: 'NotBuilt',
        startedAt: null,
        completesAt: null,
      });
    }

    if (scenario === 'returningConstruction') {
      this.seedLumberYardUnderConstruction();
    }

    if (scenario === 'smithUnavailable') {
      this.seedStandingForge();
    }
  }

  /** Development-only. Moves the fake clock; the caller then reloads. */
  advance(minutes: number): void {
    this.clock.advance(minutes);
  }

  async load(signal?: AbortSignal): Promise<SettlementState> {
    await this.settle(signal);

    return this.snapshot();
  }

  async beginConstruction(
    kind: BuildingKind,
    signal?: AbortSignal,
  ): Promise<SettlementState> {
    await this.settle(signal);

    const definition = definitionOf(kind);
    const construction = this.constructionOf(kind);

    // Everything that can reject is checked before anything is spent, so a
    // refused command always leaves the settlement exactly as it was.
    if (construction.status === 'Complete') {
      throw new CommandRejection(`The ${definition.displayName} is already standing.`);
    }

    if (construction.status === 'UnderConstruction') {
      throw new CommandRejection(`Work on the ${definition.displayName} is already under way.`);
    }

    if (!this.prerequisiteMet(kind)) {
      throw new CommandRejection(`${definition.displayName} needs the ${this.prerequisiteName(kind)} first.`);
    }

    const short = definition.cost.filter(
      (entry) => this.amountOf(entry.kind) < entry.amount,
    );

    if (short.length > 0) {
      throw new CommandRejection(
        `Not enough ${short.map((entry) => resourceDisplayNames[entry.kind]).join(' or ')}.`,
      );
    }

    // All-or-nothing: nothing above this line has changed a balance.
    for (const entry of definition.cost) {
      this.balances.set(entry.kind, this.amountOf(entry.kind) - entry.amount);
    }

    const now = this.clock.now();

    construction.status = 'UnderConstruction';
    construction.startedAt = now;
    construction.completesAt = new Date(now.getTime() + definition.durationMinutes * 60_000);

    this.record(`Work began on the ${definition.displayName}.`, now);

    return this.snapshot();
  }

  async procureConstructionShortfalls(
    kind: BuildingKind,
    signal?: AbortSignal,
  ): Promise<SettlementState> {
    await this.settle(signal);

    const definition = definitionOf(kind);
    const construction = this.constructionOf(kind);

    if (construction.status !== 'NotBuilt' || !this.prerequisiteMet(kind)) {
      throw new CommandRejection(
        `The ${definition.displayName} cannot be raised, so there is nothing to procure for it.`,
      );
    }

    // Gold is never itself a shortfall — there is no recursive way to procure
    // the thing procurement is paid in.
    const shortfalls = definition.cost
      .filter((entry) => entry.kind !== 'Gold' && this.amountOf(entry.kind) < entry.amount)
      .map((entry) => ({
        kind: entry.kind,
        short: entry.amount - this.amountOf(entry.kind),
      }));

    if (shortfalls.length === 0) {
      throw new CommandRejection(
        `The ${definition.displayName} is not short of anything.`,
      );
    }

    const price = shortfalls.reduce(
      (total, shortfall) => total + shortfall.short * goldPerMissingUnit,
      0,
    );

    if (this.amountOf('Gold') < price) {
      throw new CommandRejection(
        `Procuring that costs ${String(price)} Gold, and the settlement holds ${String(this.amountOf('Gold'))}.`,
      );
    }

    this.balances.set('Gold', this.amountOf('Gold') - price);

    for (const shortfall of shortfalls) {
      this.balances.set(shortfall.kind, this.amountOf(shortfall.kind) + shortfall.short);
    }

    this.record(
      `Bought ${shortfalls
        .map((s) => `${String(s.short)} ${resourceDisplayNames[s.kind]}`)
        .join(' and ')} for ${String(price)} Gold.`,
      this.clock.now(),
    );

    return this.snapshot();
  }

  // ---- the forge ----

  async beginCraft(order: CraftOrder, signal?: AbortSignal): Promise<SettlementState> {
    await this.settle(signal);

    const technique = this.validateCraftOrder(order);

    // Everything that can reject is checked before anything is spent, so a
    // refused command always leaves the settlement exactly as it was.
    const cost = craftCostOf(technique);
    const short = cost.filter((entry) => this.amountOf(entry.kind) < entry.amount);

    if (short.length > 0) {
      throw new CommandRejection(
        `Not enough ${short.map((entry) => resourceDisplayNames[entry.kind]).join(' or ')}.`,
      );
    }

    for (const entry of cost) {
      this.balances.set(entry.kind, this.amountOf(entry.kind) - entry.amount);
    }

    const now = this.clock.now();
    const durationMinutes = craftDurationOf(technique);

    this.craft = {
      id: 'craft-1',
      status: 'InProgress',
      order,
      cost,
      durationMinutes,
      qualityFloor: technique.qualityFloor,
      startedAt: now,
      completesAt: new Date(now.getTime() + durationMinutes * 60_000),
      batch: null,
      destination: null,
      destinationChosenAt: null,
      feePaidGold: null,
      askingPriceGold: null,
    };

    this.record(
      `${smithName} began ${String(kingdomRequest.quantity)} infantry swords.`,
      now,
    );

    return this.snapshot();
  }

  async procureCraftShortfalls(
    order: CraftOrder,
    signal?: AbortSignal,
  ): Promise<SettlementState> {
    await this.settle(signal);

    const technique = this.validateCraftOrder(order);

    // Gold is never itself a shortfall — there is no recursive way to procure
    // the thing procurement is paid in.
    const shortfalls = craftCostOf(technique)
      .filter((entry) => entry.kind !== 'Gold' && this.amountOf(entry.kind) < entry.amount)
      .map((entry) => ({ kind: entry.kind, short: entry.amount - this.amountOf(entry.kind) }));

    if (shortfalls.length === 0) {
      throw new CommandRejection('The forge is not short of anything for this work.');
    }

    const price = shortfalls.reduce(
      (total, shortfall) => total + shortfall.short * goldPerMissingUnit,
      0,
    );

    if (this.amountOf('Gold') < price) {
      throw new CommandRejection(
        `Procuring that costs ${String(price)} Gold, and the settlement holds ${String(this.amountOf('Gold'))}.`,
      );
    }

    this.balances.set('Gold', this.amountOf('Gold') - price);

    for (const shortfall of shortfalls) {
      this.balances.set(shortfall.kind, this.amountOf(shortfall.kind) + shortfall.short);
    }

    this.record(
      `Bought ${shortfalls
        .map((s) => `${String(s.short)} ${resourceDisplayNames[s.kind]}`)
        .join(' and ')} for ${String(price)} Gold.`,
      this.clock.now(),
    );

    return this.snapshot();
  }

  /**
   * One batch, one destination, for good.
   *
   * The guard is the whole rule: it passes only from `AwaitingDestination`, so a
   * second command — the same destination or a different one — is refused and
   * changes nothing. There is no transition out of `Settled` to write.
   */
  async chooseCraftDestination(
    craftId: string,
    destination: Destination,
    signal?: AbortSignal,
  ): Promise<SettlementState> {
    await this.settle(signal);

    const craft = this.craft;

    if (craft === null) {
      throw new CommandRejection('Nothing has been forged yet.');
    }

    if (craft.id !== craftId) {
      throw new CommandRejection('That work is not the batch the forge is holding.');
    }

    if (craft.status === 'InProgress') {
      throw new CommandRejection('The swords are not finished yet.');
    }

    if (craft.status === 'Settled') {
      throw new CommandRejection(
        `These swords have already gone to ${destinationPhrase(craft.destination)}. That cannot be changed.`,
      );
    }

    const now = this.clock.now();

    craft.status = 'Settled';
    craft.destination = destination;
    craft.destinationChosenAt = now;

    switch (destination) {
      case 'Contracted':
        // The one destination that moves Gold, in the same transition that
        // settles the batch.
        craft.feePaidGold = kingdomRequest.feeGold;
        this.balances.set('Gold', this.amountOf('Gold') + kingdomRequest.feeGold);
        this.record(
          `Delivered ${String(kingdomRequest.quantity)} infantry swords to the kingdom for ${String(kingdomRequest.feeGold)} Gold.`,
          now,
        );
        break;
      case 'Listed':
        // No Gold. There is no buyer, and there is no infinite vendor.
        craft.askingPriceGold = listingAskingPriceGold;
        this.record(
          `Listed ${String(kingdomRequest.quantity)} infantry swords for sale at ${String(listingAskingPriceGold)} Gold.`,
          now,
        );
        break;
      case 'Equipped':
        this.record(
          `Set ${String(kingdomRequest.quantity)} infantry swords aside to arm your own company.`,
          now,
        );
        break;
      case 'Retained':
        this.record(
          `Kept ${String(kingdomRequest.quantity)} infantry swords in the settlement.`,
          now,
        );
        break;
    }

    return this.snapshot();
  }

  // ---- internals ----

  /**
   * Applies latency, honours cancellation, and resolves anything now due.
   *
   * Completion happens here rather than on a timer: a settlement left alone for
   * three days has three days of work resolved by its next read.
   */
  private async settle(signal?: AbortSignal): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }

    signal?.throwIfAborted();

    const now = this.clock.now();

    for (const definition of buildingDefinitions) {
      const construction = this.constructionOf(definition.kind);

      if (
        construction.status === 'UnderConstruction' &&
        construction.completesAt !== null &&
        now.getTime() >= construction.completesAt.getTime()
      ) {
        construction.status = 'Complete';
        this.record(
          `The ${definition.displayName} is finished.`,
          construction.completesAt,
        );
      }
    }

    // The craft completes the same way a building does, and cannot complete
    // twice: the guard passes only from `InProgress`, and the transition leaves
    // it somewhere else. The change is dated when the work actually finished,
    // not when it happened to be read.
    const craft = this.craft;

    if (
      craft !== null &&
      craft.status === 'InProgress' &&
      now.getTime() >= craft.completesAt.getTime()
    ) {
      craft.status = 'AwaitingDestination';
      craft.batch = this.mintBatch(craft);
      this.record(
        `${smithName} finished ${String(kingdomRequest.quantity)} infantry swords.`,
        craft.completesAt,
      );
    }
  }

  /**
   * The batch, from the order and nothing else.
   *
   * **Quality is the floor, exactly.** Ordinary forging names a floor before the
   * confirm and delivers precisely it, so the outcome is predictable from the
   * inputs. There is no roll, no smith variance and no upside above the promise
   * — introducing one would teach the player to expect something the screen
   * never said.
   */
  private mintBatch(craft: CraftRecord): EquipmentBatch {
    const technique = techniqueDefinitionOf(craft.order.techniqueId);
    const pattern = patterns.find((candidate) => candidate.id === craft.order.patternId);

    return {
      id: `batch-${craft.id}`,
      patternName: pattern?.displayName ?? 'Infantry sword',
      quantity: kingdomRequest.quantity,
      quality: craft.qualityFloor,
      conditionPercent: 100,
      equipmentEffect: technique?.equipmentEffect ?? '',
      equipmentEffectTier: technique?.equipmentEffectTier ?? 1,
      maker: {
        smithName,
        smithMastery,
        settlementName: 'Arkazian Outpost',
        forgedAtUtc: craft.completesAt.toISOString(),
        patternId: craft.order.patternId,
        gradeId: craft.order.gradeId,
        techniqueId: craft.order.techniqueId,
        contentVersion,
        rulesVersion,
      },
    };
  }

  /**
   * Everything that must be true before a craft can begin, in one place, so
   * `beginCraft` and `procureCraftShortfalls` cannot disagree about it.
   */
  private validateCraftOrder(order: CraftOrder) {
    if (this.constructionOf('Forge').status !== 'Complete') {
      throw new CommandRejection('The settlement has no forge yet.');
    }

    if (this.craft !== null) {
      throw new CommandRejection(
        this.craft.status === 'Settled'
          ? 'The request has been answered. There is nothing more to forge.'
          : 'The forge is already working on the swords.',
      );
    }

    if (order.patternId !== kingdomRequest.patternId) {
      throw new CommandRejection('The forge has no such pattern.');
    }

    const grade = grades.find((candidate) => candidate.id === order.gradeId);

    if (grade === undefined) {
      throw new CommandRejection('The forge has no such material grade.');
    }

    if (grade.unavailableReason !== null) {
      throw new CommandRejection(`${grade.displayName}: ${grade.unavailableReason}.`);
    }

    const technique = techniqueDefinitionOf(order.techniqueId);

    if (technique === undefined) {
      throw new CommandRejection('The forge has no such technique.');
    }

    const smith = this.smiths().find((candidate) => candidate.id === order.smithId);

    if (smith === undefined) {
      throw new CommandRejection('No such smith works here.');
    }

    if (smith.unavailableReason !== null) {
      throw new CommandRejection(`${smith.name} cannot take the work. ${smith.unavailableReason}`);
    }

    return technique;
  }

  private snapshot(): SettlementState {
    const now = this.clock.now();

    return {
      settlement: {
        name: 'Arkazian Outpost',
        kingdom: 'Arkazia',
        stage: 'Outpost',
        geography:
          'A claimed site on the ridge road, where the pass narrows above the alpine forest. ' +
          'Stone to the north, iron in the slopes, timber on the lower ground.',
        loreHint:
          'The old road cuts through stone the masons say was marked before Arkazia had a name.',
        crestKey: 'heraldry/arkazian-token',
      },
      resources: this.resources(),
      buildings: this.buildings(),
      residents: this.residents(),
      // Newest first, and a copy: nothing outside can append to the record.
      changes: [...this.changes].reverse(),
      attention: this.attention(now),
      forge: this.forge(),
      asOfUtc: now.toISOString(),
    };
  }

  private forge(): ForgeState {
    const standing = this.constructionOf('Forge').status === 'Complete';

    return {
      available: standing,
      unavailableReason: standing ? null : 'The settlement has no forge yet',
      request: kingdomRequest,
      patterns,
      grades,
      techniques: techniqueOptions(),
      smiths: this.smiths(),
      craft: this.craft === null ? null : craftView(this.craft),
    };
  }

  /**
   * The roster, with availability resolved.
   *
   * Two independent reasons a smith cannot take work, and they mean different
   * things: **away** is where he is, and **busy** is what he is doing. Only the
   * first can be true before anything has been forged.
   */
  private smiths(): readonly SmithOption[] {
    if (this.scenario === 'smithUnavailable') {
      return smithRoster(smithAwayReason);
    }

    if (this.craft !== null && this.craft.status === 'InProgress') {
      return smithRoster('At the anvil, working the swords.');
    }

    return smithRoster(null);
  }

  private resources(): ResourceBalance[] {
    return resourceOrder.map((kind) => ({
      kind,
      displayName: resourceDisplayNames[kind],
      amount: this.amountOf(kind),
    }));
  }

  private buildings(): Building[] {
    return buildingDefinitions.map((definition) => {
      const construction = this.constructionOf(definition.kind);
      const previewed = construction.status === 'NotBuilt' && !this.prerequisiteMet(definition.kind);

      const base = {
        kind: definition.kind,
        displayName: definition.displayName,
        description: definition.description,
        cost: definition.cost,
        durationMinutes: definition.durationMinutes,
        artKey: `buildings/${kebab(definition.kind)}`,
        startedAtUtc: construction.startedAt?.toISOString() ?? null,
        completesAtUtc: construction.completesAt?.toISOString() ?? null,
      } as const;

      if (previewed) {
        return {
          ...base,
          status: 'Previewed' as const,
          yieldSummary: null,
          unavailableReason: `Needs the ${this.prerequisiteName(definition.kind)}`,
        };
      }

      return {
        ...base,
        status: construction.status,
        yieldSummary: construction.status === 'Complete' ? definition.yieldSummary : null,
        unavailableReason: null,
      };
    });
  }

  private residents() {
    if (this.scenario === 'empty') {
      return [];
    }

    // The introduction follows the settlement: a smith waiting on a workshop
    // reads as neglect once the forge is standing and he is working in it.
    const standing = this.constructionOf('Forge').status === 'Complete';

    return [
      {
        id: smithId,
        name: smithName,
        role: smithMastery,
        introduction: standing
          ? 'Came up through the pass forges at Obsidia and stayed for the quiet. ' +
            'The settlement has a forge now, and he keeps its fire in.'
          : 'Came up through the pass forges at Obsidia and stayed for the quiet. ' +
            'He keeps his tools laid out for a workshop the settlement has not built yet.',
        portraitKey: 'people/halvard-stenn',
      },
    ];
  }

  private attention(now: Date): AttentionItem[] {
    const items: AttentionItem[] = buildingDefinitions
      .filter((definition) => this.constructionOf(definition.kind).status === 'UnderConstruction')
      .map((definition) => {
        const construction = this.constructionOf(definition.kind);

        return {
          id: `attention-${kebab(definition.kind)}`,
          summary: `The ${definition.displayName} is still under construction.`,
          detail: `${String(minutesUntil(construction.completesAt, now))} minutes of work remain.`,
          href: '/settlement',
        };
      });

    const craft = this.craft;

    if (craft?.status === 'InProgress') {
      items.push({
        id: 'attention-craft',
        summary: 'The swords are still being forged.',
        detail: `${String(minutesUntil(craft.completesAt, now))} minutes of work remain.`,
        href: '/forge',
      });
    }

    // A finished batch nobody has decided about is the thing a returning player
    // most needs put in front of them: it is the only state in the settlement
    // that is waiting on a decision rather than on time.
    if (craft?.status === 'AwaitingDestination') {
      items.push({
        id: 'attention-destination',
        summary: 'The swords are finished and waiting on your decision.',
        detail: 'They can go to one place only, and the choice is final.',
        href: '/forge/destination',
      });
    }

    return items;
  }

  private record(summary: string, occurredAt: Date): void {
    this.changes.push({
      id: `change-${String(this.nextChangeId++)}`,
      summary,
      occurredAtUtc: occurredAt.toISOString(),
    });
  }

  private amountOf(kind: ResourceKind): number {
    return this.balances.get(kind) ?? 0;
  }

  private constructionOf(kind: BuildingKind): Construction {
    const construction = this.constructions.get(kind);

    if (construction === undefined) {
      throw new CommandRejection(`There is no ${kind} on this site.`);
    }

    return construction;
  }

  private prerequisiteMet(kind: BuildingKind): boolean {
    const requires = definitionOf(kind).requires;

    return requires === null || this.constructionOf(requires).status === 'Complete';
  }

  /** What must stand first, named for a player. Only called when there is one. */
  private prerequisiteName(kind: BuildingKind): string {
    const requires = definitionOf(kind).requires;

    return requires === null ? 'prerequisite' : definitionOf(requires).displayName;
  }

  /**
   * The returning player's opening position: the Lumber Yard already under way,
   * its cost already paid, due five minutes after the session starts.
   */
  private seedLumberYardUnderConstruction(): void {
    const definition = definitionOf('LumberYard');

    for (const entry of definition.cost) {
      this.balances.set(entry.kind, this.amountOf(entry.kind) - entry.amount);
    }

    this.constructions.set('LumberYard', {
      status: 'UnderConstruction',
      startedAt: startOfSession,
      completesAt: new Date(startOfSession.getTime() + definition.durationMinutes * 60_000),
    });

    this.record('Work began on the Lumber Yard.', startOfSession);
  }

  /**
   * A settlement that has already reached the forge.
   *
   * Every prerequisite is marked complete directly rather than paid for: this is
   * an opening position, not a history, and charging for buildings the scenario
   * asserts were raised long ago would leave nothing to forge with.
   */
  private seedStandingForge(): void {
    for (const kind of ['CommandHall', 'Forge'] as const) {
      this.constructions.set(kind, {
        status: 'Complete',
        startedAt: startOfSession,
        completesAt: startOfSession,
      });
    }
  }
}

/**
 * The mutable record, as the immutable union.
 *
 * The one place the two shapes meet. A settled craft is rebuilt member by
 * member rather than spread, because the union's whole value is that
 * `askingPriceGold` cannot ride along on a batch that was equipped.
 */
function craftView(craft: CraftRecord): ForgeCraft {
  const base = {
    id: craft.id,
    order: craft.order,
    cost: craft.cost,
    durationMinutes: craft.durationMinutes,
    qualityFloor: craft.qualityFloor,
    startedAtUtc: craft.startedAt.toISOString(),
    completesAtUtc: craft.completesAt.toISOString(),
  } as const;

  if (craft.status === 'InProgress') {
    return { ...base, status: 'InProgress', batch: null };
  }

  if (craft.batch === null) {
    throw new CommandRejection('A finished craft has no batch, which cannot happen.');
  }

  if (craft.status === 'AwaitingDestination') {
    return { ...base, status: 'AwaitingDestination', batch: craft.batch };
  }

  const settled = {
    ...base,
    status: 'Settled',
    batch: craft.batch,
    destinationChosenAtUtc: (craft.destinationChosenAt ?? craft.completesAt).toISOString(),
  } as const;

  switch (craft.destination) {
    case 'Contracted':
      return { ...settled, destination: 'Contracted', feePaidGold: craft.feePaidGold ?? 0 };
    case 'Listed':
      return { ...settled, destination: 'Listed', askingPriceGold: craft.askingPriceGold ?? 0 };
    case 'Retained':
      return { ...settled, destination: 'Retained' };
    default:
      return { ...settled, destination: 'Equipped' };
  }
}

/** How a destination reads inside a refusal. */
function destinationPhrase(destination: Destination | null): string {
  switch (destination) {
    case 'Contracted':
      return 'the kingdom';
    case 'Listed':
      return 'the market';
    case 'Retained':
      return 'the settlement stores';
    default:
      return 'your own company';
  }
}

function minutesUntil(at: Date | null, now: Date): number {
  return Math.max(0, Math.ceil(((at?.getTime() ?? 0) - now.getTime()) / 60_000));
}

function definitionOf(kind: BuildingKind) {
  const definition = buildingDefinitions.find((candidate) => candidate.kind === kind);

  if (definition === undefined) {
    throw new CommandRejection(`There is no ${kind} in the catalogue.`);
  }

  return definition;
}

function kebab(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
