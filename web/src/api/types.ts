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
  | 'CommandHall'
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

/**
 * The settlement's identity.
 *
 * One settlement per player, so this is also the player's identity. It has no
 * proper name: it is an Arkazian outpost, and naming it is the player's to do
 * later.
 */
export interface SettlementSummary {
  readonly name: string;
  readonly kingdom: 'Arkazia';
  readonly stage: 'Outpost';
  readonly geography: string;
  /**
   * A single line of prose hinting that runes exist. Static text — never a
   * control, a panel or a disabled affordance.
   */
  readonly loreHint: string;
  /** Asset key for the settlement's token, resolved through the chain. */
  readonly crestKey: string;
}

export interface SettlementState {
  readonly settlement: SettlementSummary;
  readonly resources: readonly ResourceBalance[];
  readonly buildings: readonly Building[];
  readonly residents: readonly Person[];
  readonly changes: readonly ChangeEntry[];
  readonly attention: readonly AttentionItem[];
  /** The server's notion of now, so nothing derives progress from a local clock. */
  readonly asOfUtc: string;
}

/** One resource a construction is short of, and what buying it would cost. */
export interface Shortfall {
  readonly kind: ResourceKind;
  readonly displayName: string;
  /** How many units are missing. Always greater than zero. */
  readonly short: number;
  readonly goldPrice: number;
}

/** Why a site cannot be raised, when it cannot. */
export type Ineligibility =
  | 'AlreadyStanding'
  | 'UnderConstruction'
  | 'PrerequisiteUnmet'
  | 'Unknown';

/**
 * Everything the confirm screen needs, derived from a state it already holds.
 *
 * For reading only. The source recomputes all of it at command time — between
 * a render and a click the settlement may have moved, and the screen is not
 * the authority on what it can afford.
 */
export interface ConstructionQuote {
  readonly building: Building;
  readonly cost: readonly ResourceCostEntry[];
  readonly durationMinutes: number;
  /** When it would be done, if begun at `asOfUtc`. */
  readonly completesAtUtc: string;
  /** Every balance, as it would stand after the spend. */
  readonly after: readonly ResourceBalance[];
  readonly shortfalls: readonly Shortfall[];
  readonly totalGoldPrice: number;
  /** Gold remaining after procuring the shortfalls. Negative when unaffordable. */
  readonly goldAfterProcurement: number;
  /** `null` when the site can be raised. */
  readonly ineligibility: Ineligibility | null;
}

/** A command the source refused, with a reason fit to show a player. */
export class CommandRejection extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommandRejection';
  }
}

/**
 * The seam. Today a fake source; later an HTTP one. Components depend on this
 * interface and cannot tell which they were given.
 *
 * **Every command returns the whole resulting state** — the shape a POST
 * followed by a re-read takes. Nothing here mutates state a component holds,
 * and no command takes an amount: the source decides how much, because a caller
 * that could choose could choose wrong. See
 * [ADR-0017](../../../docs/adr/0017-commands-over-the-settlement-state-seam.md).
 */
export interface SettlementStateSource {
  load(signal?: AbortSignal): Promise<SettlementState>;

  /**
   * Spends the whole cost and starts the work in one transition, or changes
   * nothing and rejects.
   */
  beginConstruction(kind: BuildingKind, signal?: AbortSignal): Promise<SettlementState>;

  /**
   * Buys every resource this construction is currently short of, in one
   * all-or-nothing act. Rejects when there is no shortfall, when Gold is
   * insufficient, or when the site is no longer eligible.
   */
  procureConstructionShortfalls(
    kind: BuildingKind,
    signal?: AbortSignal,
  ): Promise<SettlementState>;
}
