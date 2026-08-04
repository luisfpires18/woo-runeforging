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
  readonly forge: ForgeState;
  /** The server's notion of now, so nothing derives progress from a local clock. */
  readonly asOfUtc: string;
}

// ---------------------------------------------------------------------------
// The forge
//
// Ordinary forging only. It is deterministic from end to end: transparent
// duration, a guaranteed quality floor, and an output that is a pure function
// of the order plus content. There is no probability model anywhere in this
// file, and no vocabulary for one.
// ---------------------------------------------------------------------------

/**
 * Where a finished batch went. **Exclusive — one only, and forever.**
 *
 * The same object cannot be equipped, sold and delivered at once
 * (Workbase §8, `GLOSSARY.md` §3).
 */
export type Destination = 'Equipped' | 'Contracted' | 'Listed' | 'Retained';

/**
 * How good the work is.
 *
 * A PLACEHOLDER ladder of two. `Sound` was deliberately not used: `rune_list.md`
 * names Sound as a rune — *vibration and silence* — and reusing the word for a
 * quality tier would collide with rune vocabulary the moment runes arrive.
 */
export type QualityGrade = 'Serviceable' | 'Fine';

/** What the player chose. Everything the craft is, derives from this. */
export interface CraftOrder {
  readonly patternId: string;
  readonly gradeId: string;
  readonly techniqueId: string;
  readonly smithId: string;
}

/** Who made it, from what, under which rules. Follows the batch onward. */
export interface MakerProvenance {
  readonly smithName: string;
  readonly smithMastery: string;
  readonly settlementName: string;
  readonly forgedAtUtc: string;
  readonly patternId: string;
  readonly gradeId: string;
  readonly techniqueId: string;
  /** So an old batch can still be explained after the rules change. */
  readonly contentVersion: string;
  readonly rulesVersion: string;
}

/**
 * A fungible quantity of identical equipment — not a hundred records.
 *
 * Every field is a pure function of the {@link CraftOrder} and the catalogue.
 * `quality` is the craft's quality floor **exactly**: ordinary forging promises
 * a floor and delivers precisely it, so the player can predict the result. Any
 * variance above a floor is a question for authoritative forging.
 */
export interface EquipmentBatch {
  readonly id: string;
  readonly patternName: string;
  readonly quantity: number;
  readonly quality: QualityGrade;
  readonly conditionPercent: number;
  /** One plain sentence. Never a score. */
  readonly equipmentEffect: string;
  /** A bounded tier, for the systems that later have to reason about it. */
  readonly equipmentEffectTier: number;
  readonly maker: MakerProvenance;
}

interface CraftBase {
  readonly id: string;
  readonly order: CraftOrder;
  readonly cost: readonly ResourceCostEntry[];
  readonly durationMinutes: number;
  readonly qualityFloor: QualityGrade;
  readonly startedAtUtc: string;
  readonly completesAtUtc: string;
}

interface SettledCraft extends CraftBase {
  readonly status: 'Settled';
  readonly batch: EquipmentBatch;
  readonly destinationChosenAtUtc: string;
}

/**
 * One forge project, as a state machine you cannot hold wrongly.
 *
 * `InProgress → AwaitingDestination → Settled`, and `Settled` carries the one
 * destination it reached. The union is the enforcement: a settled craft with two
 * destinations, an unfinished craft with a batch, or an equipped batch carrying
 * an asking price are not states this type can express, so no code has to check
 * for them.
 */
export type ForgeCraft =
  | (CraftBase & { readonly status: 'InProgress'; readonly batch: null })
  | (CraftBase & { readonly status: 'AwaitingDestination'; readonly batch: EquipmentBatch })
  | (SettledCraft & { readonly destination: 'Equipped' })
  | (SettledCraft & { readonly destination: 'Contracted'; readonly feePaidGold: number })
  | (SettledCraft & { readonly destination: 'Listed'; readonly askingPriceGold: number })
  | (SettledCraft & { readonly destination: 'Retained' });

/** A standing order from the kingdom. The reason the first craft exists. */
export interface KingdomRequest {
  readonly id: string;
  readonly summary: string;
  /** Who needs them and why they are exposed. */
  readonly detail: string;
  readonly patternId: string;
  readonly quantity: number;
  readonly feeGold: number;
  /**
   * What the kingdom expects, in words.
   *
   * **Informational only.** Nothing expires, nothing is penalised, and no clock
   * reads it — `COMPONENTS-AND-STATES.md` §5 forbids copy implying urgency the
   * game does not have.
   */
  readonly expectation: string;
}

export interface PatternOption {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
}

export interface GradeOption {
  readonly id: string;
  readonly displayName: string;
  /** `null` when it can be worked. A grade to work toward, never a locked system. */
  readonly unavailableReason: string | null;
}

/**
 * A design or process emphasis, with the terms it implies already resolved.
 *
 * The terms travel with the option rather than being recomputed by a screen, for
 * the same reason `quoteFor` derives from state: a client that could work out
 * its own cost could work out a wrong one.
 */
export interface TechniqueOption {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  /** The whole cost of the requested quantity, worked this way. */
  readonly cost: readonly ResourceCostEntry[];
  readonly durationMinutes: number;
  /** Guaranteed, and in ordinary forging exactly what comes out. */
  readonly qualityFloor: QualityGrade;
  readonly equipmentEffect: string;
}

export interface SmithOption {
  readonly id: string;
  readonly name: string;
  readonly mastery: string;
  /** `null` when the smith can take the work. */
  readonly unavailableReason: string | null;
}

/** The forge, its catalogue, and the one project it may hold. */
export interface ForgeState {
  /** Whether the Forge building stands. Nothing can be forged without it. */
  readonly available: boolean;
  readonly unavailableReason: string | null;
  readonly request: KingdomRequest;
  readonly patterns: readonly PatternOption[];
  readonly grades: readonly GradeOption[];
  readonly techniques: readonly TechniqueOption[];
  readonly smiths: readonly SmithOption[];
  /**
   * At most one craft, ever, in this slice — and it is never replaced. A second
   * project would overwrite the batch and lose the provenance and destination
   * that later systems read.
   */
  readonly craft: ForgeCraft | null;
}

/**
 * Everything the craft screen needs, derived from a state it already holds.
 *
 * For reading only, exactly like {@link ConstructionQuote}: the source
 * recomputes all of it at command time.
 */
export interface CraftQuote {
  readonly order: CraftOrder;
  readonly patternName: string;
  readonly gradeName: string;
  readonly techniqueName: string;
  readonly smithName: string;
  readonly quantity: number;
  readonly cost: readonly ResourceCostEntry[];
  readonly durationMinutes: number;
  readonly completesAtUtc: string;
  /** The guaranteed floor, which is also exactly what the batch will be. */
  readonly qualityFloor: QualityGrade;
  readonly equipmentEffect: string;
  readonly after: readonly ResourceBalance[];
  readonly shortfalls: readonly Shortfall[];
  readonly totalGoldPrice: number;
  readonly goldAfterProcurement: number;
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

  /**
   * Spends the whole cost, assigns the smith and starts the craft in one
   * transition, or changes nothing and rejects.
   *
   * **No quantity.** How many swords is the kingdom request's business, not the
   * player's — the same reasoning that keeps amounts out of procurement.
   */
  beginCraft(order: CraftOrder, signal?: AbortSignal): Promise<SettlementState>;

  /**
   * Buys everything this craft is currently short of, in one all-or-nothing
   * act. Rejects when there is no shortfall, when Gold is insufficient, or when
   * the craft could not be begun anyway.
   */
  procureCraftShortfalls(order: CraftOrder, signal?: AbortSignal): Promise<SettlementState>;

  /**
   * Sends the finished batch to exactly one destination, for good.
   *
   * Rejects unless that craft is awaiting a destination — so a second call, with
   * the same destination or a different one, changes nothing. `craftId` is
   * carried so a stale screen cannot retarget a later craft.
   */
  chooseCraftDestination(
    craftId: string,
    destination: Destination,
    signal?: AbortSignal,
  ): Promise<SettlementState>;
}
