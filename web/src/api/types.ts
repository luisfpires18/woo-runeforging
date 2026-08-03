/**
 * The contract components see.
 *
 * No React, no fetch, no fixture. Times are ISO 8601 strings — the shape a real
 * endpoint returns — and are parsed at the adapter boundary rather than in a
 * component.
 *
 * When Prompts 10–17 replace fake state with real endpoints, this file is the
 * thing that does not change.
 */

export type ResourceKind =
  | 'Gold'
  | 'Provisions'
  | 'Timber'
  | 'Stone'
  | 'Ore'
  | 'WorkshopSupplies';

export const resourceOrder: readonly ResourceKind[] = [
  'Gold',
  'Provisions',
  'Timber',
  'Stone',
  'Ore',
  'WorkshopSupplies',
];

export type BuildingKind =
  | 'HouseHall'
  | 'Storehouse'
  | 'LumberYard'
  | 'Quarry'
  | 'Mine'
  | 'Barracks'
  | 'Forge';

/**
 * `Previewed` is a building the settlement will one day hold but cannot raise
 * yet, because what it unlocks does not exist. It is shown rather than hidden
 * so the site reads as somewhere going somewhere.
 */
export type BuildingStatus = 'NotBuilt' | 'UnderConstruction' | 'Complete' | 'Previewed';

export interface ResourceBalance {
  readonly kind: ResourceKind;
  readonly displayName: string;
  readonly amount: number;
}

export interface ResourceCostEntry {
  readonly kind: ResourceKind;
  readonly amount: number;
}

export interface Building {
  readonly kind: BuildingKind;
  readonly displayName: string;
  readonly description: string;
  readonly status: BuildingStatus;
  readonly cost: readonly ResourceCostEntry[];
  readonly durationMinutes: number;
  readonly startedAtUtc: string | null;
  readonly completesAtUtc: string | null;
  /** Present only once complete, and only for a production site. */
  readonly yieldSummary: string | null;
  /** Why it cannot be raised yet. `Previewed` buildings always carry one. */
  readonly unavailableReason: string | null;
  /** Asset key resolved through the fallback chain in `assets/`. */
  readonly artKey: string;
}

export interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly introduction: string;
  readonly portraitKey: string;
}

export interface ChangeEntry {
  readonly id: string;
  readonly summary: string;
  readonly occurredAtUtc: string;
}

export interface AttentionItem {
  readonly id: string;
  readonly summary: string;
  readonly detail: string | null;
  /** Where the player resolves it. Every attention item is a link. */
  readonly href: string;
}

export interface HouseSummary {
  readonly name: string;
  readonly kingdom: 'Arkazia';
  readonly crestKey: string;
}

export interface SettlementSummary {
  readonly name: string;
  readonly stage: 'Outpost';
  readonly geography: string;
  /**
   * A single line of prose hinting that runes exist. Static text — never a
   * control, a panel or a disabled affordance.
   */
  readonly loreHint: string;
}

export interface HouseState {
  readonly house: HouseSummary;
  readonly settlement: SettlementSummary;
  readonly resources: readonly ResourceBalance[];
  readonly buildings: readonly Building[];
  readonly household: readonly Person[];
  readonly changes: readonly ChangeEntry[];
  readonly attention: readonly AttentionItem[];
  /** The server's notion of now, so nothing derives progress from a local clock. */
  readonly asOfUtc: string;
}

/**
 * The seam. Today a fake source; later an HTTP one. Components depend on this
 * interface and cannot tell which they were given.
 */
export interface HouseStateSource {
  load(signal?: AbortSignal): Promise<HouseState>;
}
