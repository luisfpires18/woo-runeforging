import type { BuildingKind, ResourceCostEntry, ResourceKind } from '../types.ts';

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
  /** Buildings that cannot be raised yet, and why. */
  readonly previewReason: string | null;
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
    previewReason: null,
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
    previewReason: null,
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
    previewReason: null,
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
    previewReason: null,
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
    previewReason: null,
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
    previewReason: 'Needs the Command Hall',
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
    previewReason: 'Needs the Command Hall',
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
