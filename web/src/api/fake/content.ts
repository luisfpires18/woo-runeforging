import type {
  BuildingKind,
  GradeOption,
  KingdomRequest,
  PatternOption,
  QualityGrade,
  ResourceCostEntry,
  ResourceKind,
  SmithOption,
  TechniqueOption,
} from '../types.ts';

/**
 * Starter content, mirroring `src/Woo.Api/Content/` so the mock and the domain
 * do not drift.
 *
 * PLACEHOLDER CONTENT. The settlement name, the smith, and every cost and
 * duration below are starter values chosen so the first session presents a
 * choice — they are not balance decisions, and playtesting is expected to
 * replace them.
 *
 * Note for anyone editing: that caveat belongs in code and documentation only.
 * Nothing in the interface tells a player any of this is invented.
 */

export const resourceDisplayNames: Record<ResourceKind, string> = {
  Gold: 'Gold',
  Provisions: 'Provisions',
  Timber: 'Timber',
  Stone: 'Stone',
  Ore: 'Ore',
  WorkshopSupplies: 'Workshop Supplies',
};

export interface BuildingDefinition {
  readonly kind: BuildingKind;
  readonly displayName: string;
  readonly description: string;
  readonly cost: readonly ResourceCostEntry[];
  readonly durationMinutes: number;
  readonly yieldSummary: string | null;
  /**
   * What must be standing first. A building with a prerequisite is `Previewed`
   * while that prerequisite is not `Complete`, and becomes raisable the moment
   * it is — the preview is a statement about the site, not a permanent label.
   */
  readonly requires: BuildingKind | null;
}

export const buildingDefinitions: readonly BuildingDefinition[] = [
  {
    kind: 'CommandHall',
    displayName: 'Command Hall',
    description: 'Where the settlement is run. Governance, reputation and standing.',
    cost: [
      { kind: 'Timber', amount: 120 },
      { kind: 'Stone', amount: 80 },
      { kind: 'WorkshopSupplies', amount: 40 },
    ],
    durationMinutes: 30,
    yieldSummary: null,
    requires: null,
  },
  {
    kind: 'Storehouse',
    displayName: 'Storehouse',
    description: "Covered, guarded storage for the settlement's goods.",
    cost: [
      { kind: 'Timber', amount: 90 },
      { kind: 'Stone', amount: 30 },
      { kind: 'WorkshopSupplies', amount: 20 },
    ],
    durationMinutes: 20,
    yieldSummary: null,
    requires: null,
  },
  {
    kind: 'LumberYard',
    displayName: 'Lumber Yard',
    description: 'Felling and sawing in the alpine forest below the ridgeline.',
    cost: [
      { kind: 'Timber', amount: 40 },
      { kind: 'WorkshopSupplies', amount: 30 },
    ],
    durationMinutes: 15,
    yieldSummary: 'Timber, steadily, from the slopes below',
    requires: null,
  },
  {
    kind: 'Quarry',
    displayName: 'Quarry',
    description: 'Cut stone from the mountainside. Arkazia builds in stone.',
    cost: [
      { kind: 'Timber', amount: 60 },
      { kind: 'WorkshopSupplies', amount: 30 },
    ],
    durationMinutes: 20,
    yieldSummary: 'Stone, cut and squared',
    requires: null,
  },
  {
    kind: 'Mine',
    displayName: 'Mine',
    description: 'A shaft into the iron-rich slopes above the pass.',
    cost: [
      { kind: 'Timber', amount: 80 },
      { kind: 'Stone', amount: 40 },
      { kind: 'WorkshopSupplies', amount: 40 },
    ],
    durationMinutes: 25,
    yieldSummary: 'Ore, raised from the shaft',
    requires: null,
  },
  {
    kind: 'Barracks',
    displayName: 'Barracks',
    description: 'Quarters and a training yard for the first company.',
    cost: [
      { kind: 'Timber', amount: 140 },
      { kind: 'Stone', amount: 100 },
      { kind: 'WorkshopSupplies', amount: 60 },
    ],
    durationMinutes: 45,
    yieldSummary: null,
    requires: 'CommandHall',
  },
  {
    kind: 'Forge',
    displayName: 'Forge',
    description: 'Anvil, bellows and a fire that does not go out.',
    cost: [
      { kind: 'Stone', amount: 120 },
      { kind: 'Ore', amount: 80 },
      { kind: 'WorkshopSupplies', amount: 80 },
    ],
    durationMinutes: 40,
    yieldSummary: null,
    requires: 'CommandHall',
  },
];

export const openingBalances: Record<ResourceKind, number> = {
  Gold: 250,
  Provisions: 200,
  Timber: 220,
  Stone: 180,
  Ore: 120,
  WorkshopSupplies: 100,
};

// ---------------------------------------------------------------------------
// The forge
// ---------------------------------------------------------------------------

/**
 * Which catalogue a craft was made against, and which rules priced and timed it.
 *
 * Stored on every batch so an old one can still be explained after the numbers
 * change. They are separate because content moves far more often than rules do.
 */
export const contentVersion = '2026.08.1';
export const rulesVersion = 'forge-ordinary-1';

/**
 * The standing request. The reason the first craft exists at all.
 *
 * **Canon, precisely:** `arkazia.md` lists *Red Bastion* as the barracks and
 * *Bastion* as the unit it raises — sword and shield, core line infantry. The
 * swords are for a Bastion company attached to that barracks, not for the
 * barracks itself.
 *
 * **The expectation is words, not a timer.** Nothing reads it, nothing expires,
 * and no penalty exists. Foundations of Iron has no deadline that runs while the
 * player sleeps, and the copy must not imply one.
 */
export const kingdomRequest: KingdomRequest = {
  id: 'request-bastion-swords',
  summary: '100 infantry swords for a Bastion company',
  detail:
    'A Bastion company attached to the Red Bastion holds the far end of the pass, ' +
    'above the Sylvaran treeline, with sword-and-shield men carrying blades that ' +
    'have been reground until there is little left to regrind. They are the ' +
    'nearest company to the border and the furthest from a working forge.',
  patternId: 'pattern.sword.infantry.arkazian',
  quantity: 100,
  feeGold: 400,
  expectation: 'The kingdom expects them within three days.',
};

export const patterns: readonly PatternOption[] = [
  {
    id: 'pattern.sword.infantry.arkazian',
    displayName: 'Arkazian infantry sword',
    description:
      'A straight, heavy-tanged blade meant to be used behind a kite shield, ' +
      'in a line, for a long time.',
  },
];

/**
 * Material grades. Steel is visible and cannot be worked yet.
 *
 * A grade the player can work toward is a different thing from a locked system:
 * the reason is stated, and it names a building rather than a paywall.
 */
export const grades: readonly GradeOption[] = [
  { id: 'grade.iron', displayName: 'Iron', unavailableReason: null },
  {
    id: 'grade.steel',
    displayName: 'Steel',
    unavailableReason: 'Needs a furnace the settlement has not built',
  },
];

export interface TechniqueDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  /** Multiplies the pattern's base cost. */
  readonly costMultiplier: number;
  /** Multiplies the pattern's base duration. */
  readonly durationMultiplier: number;
  /** Extra Ore, where the technique wastes more of it. */
  readonly extraOre: number;
  /**
   * The guaranteed floor — and, in ordinary forging, exactly what comes out.
   * There is no roll above it.
   */
  readonly qualityFloor: QualityGrade;
  readonly equipmentEffect: string;
  readonly equipmentEffectTier: number;
}

/**
 * Three techniques, so the choice is a real one.
 *
 * Each shifts cost, duration and outcome deterministically. None of them can
 * fail, waste the materials, or produce less than it promises — that is what
 * "ordinary" means here, and it is the thing Runeforging will later break.
 */
export const techniques: readonly TechniqueDefinition[] = [
  {
    id: 'technique.standard',
    displayName: 'Standard pattern',
    description: 'The garrison pattern, worked the way the pass forges have always worked it.',
    costMultiplier: 1,
    durationMultiplier: 1,
    extraOre: 0,
    qualityFloor: 'Serviceable',
    equipmentEffect: 'Reliable in the line, and easy to replace.',
    equipmentEffectTier: 1,
  },
  {
    id: 'technique.hardened',
    displayName: 'Hardened edge',
    description:
      'Slower work and more charcoal: the edge is taken further so it holds through a longer engagement.',
    costMultiplier: 1.25,
    durationMultiplier: 1.5,
    extraOre: 0,
    qualityFloor: 'Fine',
    equipmentEffect: 'Holds an edge through a longer engagement.',
    equipmentEffectTier: 2,
  },
  {
    id: 'technique.quick',
    displayName: 'Quick turnaround',
    description: 'Fewer heats and more waste, to get blades into hands sooner.',
    costMultiplier: 1,
    durationMultiplier: 0.6,
    extraOre: 30,
    qualityFloor: 'Serviceable',
    equipmentEffect: 'Sound enough for the line, and nothing more.',
    equipmentEffectTier: 1,
  },
];

/** What a batch of 100 costs before the technique adjusts it. */
export const baseCraftCost: readonly ResourceCostEntry[] = [
  { kind: 'Ore', amount: 80 },
  { kind: 'Timber', amount: 20 },
  { kind: 'WorkshopSupplies', amount: 40 },
];

export const baseCraftDurationMinutes = 45;

/** The settlement's one smith, and the mastery he has reached. */
export const smithId = 'smith-1';
export const smithName = 'Halvard Stenn';
export const smithMastery = 'Weaponsmith';

/**
 * Why Halvard cannot take the work in the scenario that says so.
 *
 * Stated **without a return date**: the mock never makes him available again,
 * and copy promising the week's end would be a claim it cannot keep.
 */
export const smithAwayReason =
  'Assigned to the pass forges at Obsidia and unavailable for this request.';

/**
 * What the batch would be listed at.
 *
 * A PLACEHOLDER, and deliberately below the kingdom's fee: the contract pays
 * better than the open market because the kingdom is the one in trouble. No Gold
 * changes hands on listing — there is no buyer, and there is no infinite vendor.
 */
export const listingAskingPriceGold = 320;

export const qualityDisplayNames: Record<QualityGrade, string> = {
  Serviceable: 'Serviceable',
  Fine: 'Fine',
};

export function smithRoster(unavailableReason: string | null): readonly SmithOption[] {
  return [{ id: smithId, name: smithName, mastery: smithMastery, unavailableReason }];
}

export function techniqueDefinitionOf(id: string): TechniqueDefinition | undefined {
  return techniques.find((technique) => technique.id === id);
}

/**
 * The cost of working the request this way, whole.
 *
 * Deterministic and total — there is no per-unit arithmetic left for a caller
 * to do, and nothing here reads a clock or a random number. Rounded up, so the
 * settlement is never charged a fraction of an ingot.
 */
export function craftCostOf(technique: TechniqueDefinition): ResourceCostEntry[] {
  return baseCraftCost.map((entry) => ({
    kind: entry.kind,
    amount:
      Math.ceil(entry.amount * technique.costMultiplier) +
      (entry.kind === 'Ore' ? technique.extraOre : 0),
  }));
}

export function craftDurationOf(technique: TechniqueDefinition): number {
  return Math.ceil(baseCraftDurationMinutes * technique.durationMultiplier);
}

/** The catalogue as the seam publishes it, with every term already resolved. */
export function techniqueOptions(): readonly TechniqueOption[] {
  return techniques.map((technique) => ({
    id: technique.id,
    displayName: technique.displayName,
    description: technique.description,
    cost: craftCostOf(technique),
    durationMinutes: craftDurationOf(technique),
    qualityFloor: technique.qualityFloor,
    equipmentEffect: technique.equipmentEffect,
  }));
}
