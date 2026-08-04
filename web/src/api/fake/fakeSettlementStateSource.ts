import type {
  AttentionItem,
  Building,
  BuildingKind,
  ChangeEntry,
  ResourceBalance,
  ResourceKind,
  SettlementState,
  SettlementStateSource,
} from '../types.ts';
import { CommandRejection, resourceOrder } from '../types.ts';
import { FakeClock } from './clock.ts';
import {
  buildingDefinitions,
  goldPerMissingUnit,
  openingBalances,
  resourceDisplayNames,
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
 */
export type Scenario = 'firstSession' | 'returningConstruction' | 'empty';

const startOfSession = new Date('2026-08-03T12:00:00Z');

/** What the source holds between calls. Commands change it; `load` reads it. */
interface Construction {
  status: 'NotBuilt' | 'UnderConstruction' | 'Complete';
  startedAt: Date | null;
  completesAt: Date | null;
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
      asOfUtc: now.toISOString(),
    };
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

    return [
      {
        id: 'smith-1',
        name: 'Halvard Stenn',
        role: 'Smith',
        introduction:
          'Came up through the pass forges at Obsidia and stayed for the quiet. ' +
          'He keeps his tools laid out for a workshop the settlement has not built yet.',
        portraitKey: 'people/halvard-stenn',
      },
    ];
  }

  private attention(now: Date): AttentionItem[] {
    return buildingDefinitions
      .filter((definition) => this.constructionOf(definition.kind).status === 'UnderConstruction')
      .map((definition) => {
        const construction = this.constructionOf(definition.kind);
        const remaining = Math.max(
          0,
          Math.ceil(((construction.completesAt?.getTime() ?? 0) - now.getTime()) / 60_000),
        );

        return {
          id: `attention-${kebab(definition.kind)}`,
          summary: `The ${definition.displayName} is still under construction.`,
          detail: `${String(remaining)} minutes of work remain.`,
          href: '/settlement',
        };
      });
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
