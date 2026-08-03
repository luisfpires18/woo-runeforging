import type {
  AttentionItem,
  Building,
  ChangeEntry,
  HouseState,
  HouseStateSource,
  ResourceBalance,
  ResourceKind,
} from '../types.ts';
import { resourceOrder } from '../types.ts';
import { FakeClock } from './clock.ts';
import { buildingDefinitions, openingBalances, resourceDisplayNames } from './content.ts';

/**
 * The two scenarios the mock ships. They are distinct states, not one state
 * mutating into the other.
 *
 * - `firstSession` — nothing built. The Lumber Yard is available, and raising
 *   it is the single primary action.
 * - `returningConstruction` — the Lumber Yard is already under construction and
 *   due shortly, so the development time control can carry it to completion and
 *   the settlement view can be seen to change.
 */
export type Scenario = 'firstSession' | 'returningConstruction' | 'empty';

const startOfSession = new Date('2026-08-03T12:00:00Z');

function balances(spent: Partial<Record<ResourceKind, number>> = {}): ResourceBalance[] {
  return resourceOrder.map((kind) => ({
    kind,
    displayName: resourceDisplayNames[kind],
    amount: openingBalances[kind] - (spent[kind] ?? 0),
  }));
}

/**
 * A fake source over an in-memory scenario.
 *
 * Time only moves when {@link advance} is called, and advancing does not touch
 * component state: the next {@link load} simply returns a state derived from the
 * new time. That is deliberately the same shape as a refetch against a real
 * endpoint.
 */
export class FakeHouseStateSource implements HouseStateSource {
  private readonly clock: FakeClock;
  private readonly scenario: Scenario;
  private readonly latencyMs: number;

  constructor(scenario: Scenario = 'firstSession', latencyMs = 0) {
    this.scenario = scenario;
    this.latencyMs = latencyMs;
    this.clock = new FakeClock(startOfSession);
  }

  /** Development-only. Moves the fake clock; the caller then reloads. */
  advance(minutes: number): void {
    this.clock.advance(minutes);
  }

  async load(signal?: AbortSignal): Promise<HouseState> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }

    signal?.throwIfAborted();

    const now = this.clock.now();

    return {
      house: {
        name: 'House Karrow',
        kingdom: 'Arkazia',
        crestKey: 'heraldry/house-karrow',
      },
      settlement: {
        name: 'Ashen Reach',
        stage: 'Outpost',
        geography:
          'A claimed site on the ridge road, where the pass narrows above the alpine forest. ' +
          'Stone to the north, iron in the slopes, timber on the lower ground.',
        loreHint:
          'The old road cuts through stone the masons say was marked before Arkazia had a name.',
      },
      resources: this.resourcesFor(),
      buildings: this.buildingsFor(now),
      household: this.householdFor(),
      changes: this.changesFor(now),
      attention: this.attentionFor(now),
      asOfUtc: now.toISOString(),
    };
  }

  private resourcesFor(): ResourceBalance[] {
    if (this.scenario === 'returningConstruction') {
      // The Lumber Yard's cost has already been paid in this scenario.
      return balances({ Timber: 40, WorkshopSupplies: 30 });
    }

    return balances();
  }

  private buildingsFor(now: Date): Building[] {
    return buildingDefinitions.map((definition) => {
      const base = {
        kind: definition.kind,
        displayName: definition.displayName,
        description: definition.description,
        cost: definition.cost,
        durationMinutes: definition.durationMinutes,
        artKey: `buildings/${kebab(definition.kind)}`,
      } as const;

      if (definition.previewReason !== null) {
        return {
          ...base,
          status: 'Previewed' as const,
          startedAtUtc: null,
          completesAtUtc: null,
          yieldSummary: null,
          unavailableReason: definition.previewReason,
        };
      }

      const underConstruction =
        this.scenario === 'returningConstruction' && definition.kind === 'LumberYard';

      if (underConstruction) {
        const startedAt = startOfSession;
        const completesAt = new Date(
          startedAt.getTime() + definition.durationMinutes * 60_000,
        );
        const complete = now.getTime() >= completesAt.getTime();

        return {
          ...base,
          status: complete ? ('Complete' as const) : ('UnderConstruction' as const),
          startedAtUtc: startedAt.toISOString(),
          completesAtUtc: completesAt.toISOString(),
          yieldSummary: complete ? definition.yieldSummary : null,
          unavailableReason: null,
        };
      }

      return {
        ...base,
        status: 'NotBuilt' as const,
        startedAtUtc: null,
        completesAtUtc: null,
        yieldSummary: null,
        unavailableReason: null,
      };
    });
  }

  private householdFor() {
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
          'He keeps his tools laid out for a workshop the House has not built yet.',
        portraitKey: 'people/halvard-stenn',
      },
    ];
  }

  private changesFor(now: Date): ChangeEntry[] {
    if (this.scenario !== 'returningConstruction') {
      return [];
    }

    const changes: ChangeEntry[] = [
      {
        id: 'change-lumber-begun',
        summary: 'Work began on the Lumber Yard.',
        occurredAtUtc: startOfSession.toISOString(),
      },
    ];

    const lumberYard = this.buildingsFor(now).find((b) => b.kind === 'LumberYard');

    if (lumberYard?.status === 'Complete') {
      changes.unshift({
        id: 'change-lumber-complete',
        summary: 'The Lumber Yard is finished. Timber is coming up from the slopes.',
        occurredAtUtc: lumberYard.completesAtUtc ?? now.toISOString(),
      });
    }

    return changes;
  }

  private attentionFor(now: Date): AttentionItem[] {
    if (this.scenario !== 'returningConstruction') {
      return [];
    }

    const lumberYard = this.buildingsFor(now).find((b) => b.kind === 'LumberYard');

    if (lumberYard?.status !== 'UnderConstruction') {
      return [];
    }

    return [
      {
        id: 'attention-lumber',
        summary: 'The Lumber Yard is still under construction.',
        detail: 'Work continues on the lower ground.',
        href: '/settlement',
      },
    ];
  }
}

function kebab(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
