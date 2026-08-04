import { balancesAfter, shortfallsFrom, totalGoldPriceOf } from './procurement.ts';
import type {
  Building,
  BuildingKind,
  ConstructionQuote,
  Ineligibility,
  SettlementState,
} from './types.ts';

/**
 * What raising a site would cost, and what it would leave.
 *
 * Pure, and derived from a `SettlementState` the caller already holds — so the
 * confirm screen needs no extra round trip and no fixture import. It lives in
 * `api/` rather than `api/fake/` for exactly that reason.
 *
 * **This is for reading.** The source recomputes all of it before it spends
 * anything: between a render and a click the settlement may have moved, and a
 * screen is not the authority on what it can afford
 * ([ADR-0017](../../../docs/adr/0017-commands-over-the-settlement-state-seam.md)).
 */

export function quoteFor(
  state: SettlementState,
  kind: BuildingKind,
): ConstructionQuote | null {
  const building = state.buildings.find((candidate) => candidate.kind === kind);

  if (building === undefined) {
    return null;
  }

  // The shortfall maths is shared with forging, so a shortage of 20 Timber
  // means the same thing and costs the same wherever the player meets it.
  const after = balancesAfter(state.resources, building.cost);
  const shortfalls = shortfallsFrom(after);
  const totalGoldPrice = totalGoldPriceOf(shortfalls);

  const gold = state.resources.find((balance) => balance.kind === 'Gold')?.amount ?? 0;

  return {
    building,
    cost: building.cost,
    durationMinutes: building.durationMinutes,
    completesAtUtc: new Date(
      new Date(state.asOfUtc).getTime() + building.durationMinutes * 60_000,
    ).toISOString(),
    after,
    shortfalls,
    totalGoldPrice,
    goldAfterProcurement: gold - totalGoldPrice,
    ineligibility: ineligibilityOf(building),
  };
}

function ineligibilityOf(building: Building): Ineligibility | null {
  switch (building.status) {
    case 'Complete':
      return 'AlreadyStanding';
    case 'UnderConstruction':
      return 'UnderConstruction';
    case 'Previewed':
      return 'PrerequisiteUnmet';
    default:
      return null;
  }
}

/** The route segment for a site — `CommandHall` becomes `command-hall`. */
export function slugFor(kind: BuildingKind): string {
  return kind.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** The site a route segment names, or `null` if it names none. */
export function kindFromSlug(
  slug: string,
  buildings: readonly Building[],
): BuildingKind | null {
  return buildings.find((building) => slugFor(building.kind) === slug)?.kind ?? null;
}
