import type {
  Building,
  BuildingKind,
  ConstructionQuote,
  Ineligibility,
  ResourceBalance,
  SettlementState,
  Shortfall,
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

/** What buying a shortfall costs per missing unit. Mirrors the fake content. */
const goldPerMissingUnit = 1;

export function quoteFor(
  state: SettlementState,
  kind: BuildingKind,
): ConstructionQuote | null {
  const building = state.buildings.find((candidate) => candidate.kind === kind);

  if (building === undefined) {
    return null;
  }

  const spend = new Map(building.cost.map((entry) => [entry.kind, entry.amount]));

  const after: ResourceBalance[] = state.resources.map((balance) => ({
    ...balance,
    amount: balance.amount - (spend.get(balance.kind) ?? 0),
  }));

  // Gold is never a shortfall: there is no recursive way to procure the thing
  // procurement is paid in. A Gold shortage is reported as a Gold shortage by
  // the ordinary affordability check instead.
  const shortfalls: Shortfall[] = after
    .filter((balance) => balance.kind !== 'Gold' && balance.amount < 0)
    .map((balance) => ({
      kind: balance.kind,
      displayName: balance.displayName,
      short: -balance.amount,
      goldPrice: -balance.amount * goldPerMissingUnit,
    }));

  const totalGoldPrice = shortfalls.reduce(
    (total, shortfall) => total + shortfall.goldPrice,
    0,
  );

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
