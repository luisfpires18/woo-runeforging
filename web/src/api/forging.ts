import { balancesAfter, shortfallsFrom, totalGoldPriceOf } from './procurement.ts';
import type {
  CraftOrder,
  CraftQuote,
  Destination,
  ForgeCraft,
  ForgeState,
  SettlementState,
} from './types.ts';

/**
 * What a craft would cost, take and produce — derived from a `SettlementState`
 * the caller already holds.
 *
 * Pure, and the sibling of `quoteFor` in `construction.ts`. **For reading.** The
 * source recomputes all of it before it spends anything: between a render and a
 * click the settlement may have moved, and a screen is not the authority on what
 * it can afford
 * ([ADR-0017](../../../docs/adr/0017-commands-over-the-settlement-state-seam.md)).
 *
 * Nothing here is probabilistic and nothing here is rounded in the player's
 * disfavour. The quality floor a quote reports is exactly what the finished
 * batch carries — see
 * [ADR-0018](../../../docs/adr/0018-forging-state-machine-and-exclusive-destination.md).
 */
export function craftQuoteFor(
  state: SettlementState,
  order: CraftOrder,
): CraftQuote | null {
  const { forge } = state;

  const pattern = forge.patterns.find((candidate) => candidate.id === order.patternId);
  const grade = forge.grades.find((candidate) => candidate.id === order.gradeId);
  const technique = forge.techniques.find((candidate) => candidate.id === order.techniqueId);
  const smith = forge.smiths.find((candidate) => candidate.id === order.smithId);

  if (
    pattern === undefined ||
    grade === undefined ||
    technique === undefined ||
    smith === undefined
  ) {
    return null;
  }

  const after = balancesAfter(state.resources, technique.cost);
  const shortfalls = shortfallsFrom(after);
  const totalGoldPrice = totalGoldPriceOf(shortfalls);
  const gold = state.resources.find((balance) => balance.kind === 'Gold')?.amount ?? 0;

  return {
    order,
    patternName: pattern.displayName,
    gradeName: grade.displayName,
    techniqueName: technique.displayName,
    smithName: smith.name,
    quantity: forge.request.quantity,
    cost: technique.cost,
    durationMinutes: technique.durationMinutes,
    completesAtUtc: new Date(
      new Date(state.asOfUtc).getTime() + technique.durationMinutes * 60_000,
    ).toISOString(),
    qualityFloor: technique.qualityFloor,
    equipmentEffect: technique.equipmentEffect,
    after,
    shortfalls,
    totalGoldPrice,
    goldAfterProcurement: gold - totalGoldPrice,
  };
}

/** The order a fresh form opens on: the request's pattern, and the first of each. */
export function defaultOrder(forge: ForgeState): CraftOrder | null {
  const pattern =
    forge.patterns.find((candidate) => candidate.id === forge.request.patternId) ??
    forge.patterns[0];
  const grade = forge.grades.find((candidate) => candidate.unavailableReason === null);
  const technique = forge.techniques[0];
  const smith = forge.smiths[0];

  if (
    pattern === undefined ||
    grade === undefined ||
    technique === undefined ||
    smith === undefined
  ) {
    return null;
  }

  return {
    patternId: pattern.id,
    gradeId: grade.id,
    techniqueId: technique.id,
    smithId: smith.id,
  };
}

/**
 * Why a new craft cannot be started, when it cannot.
 *
 * Every one of these is reachable by typing a URL, so each has a screen that
 * states it and offers no confirm — the forge's version of arriving at a site
 * that cannot be raised (`WIREFRAMES.md` §5.3).
 */
export type CraftBlock =
  | 'ForgeNotBuilt'
  | 'CraftUnderWay'
  | 'AwaitingDestination'
  | 'AlreadyAnswered'
  | 'NoSmithAvailable';

/** The first thing standing in the way, or `null` when a craft can begin. */
export function craftBlockOf(forge: ForgeState): CraftBlock | null {
  if (!forge.available) {
    return 'ForgeNotBuilt';
  }

  if (forge.craft !== null) {
    switch (forge.craft.status) {
      case 'InProgress':
        return 'CraftUnderWay';
      case 'AwaitingDestination':
        return 'AwaitingDestination';
      default:
        return 'AlreadyAnswered';
    }
  }

  if (forge.smiths.every((smith) => smith.unavailableReason !== null)) {
    return 'NoSmithAvailable';
  }

  return null;
}

/** Why the destination decision cannot be made, when it cannot. */
export type DestinationBlock = 'NoCraft' | 'NotFinished' | 'AlreadyChosen';

export function destinationBlockOf(forge: ForgeState): DestinationBlock | null {
  if (forge.craft === null) {
    return 'NoCraft';
  }

  switch (forge.craft.status) {
    case 'InProgress':
      return 'NotFinished';
    case 'AwaitingDestination':
      return null;
    default:
      return 'AlreadyChosen';
  }
}

/** The four destinations, in the order they are offered. */
export const destinations: readonly Destination[] = [
  'Equipped',
  'Contracted',
  'Listed',
  'Retained',
];

export function destinationLabel(destination: Destination): string {
  switch (destination) {
    case 'Equipped':
      return 'Equip your own company';
    case 'Contracted':
      return 'Fulfil the kingdom contract';
    case 'Listed':
      return 'List them for sale';
    case 'Retained':
      return 'Retain them';
  }
}

/** What choosing it means, in one sentence, before it is chosen. */
export function destinationConsequence(
  destination: Destination,
  feeGold: number,
): string {
  switch (destination) {
    case 'Equipped':
      return 'The swords are set aside for the company you raise. They arm your own line and leave the settlement only when it marches.';
    case 'Contracted':
      return `The swords go to the Bastion company on the pass, and the kingdom pays ${String(feeGold)} Gold.`;
    case 'Listed':
      return 'The swords are offered at market price. Nothing is paid until a buyer takes them.';
    case 'Retained':
      return 'The swords stay in the settlement, unpromised, until you decide otherwise.';
  }
}

/** What is true of a craft that has reached its destination. */
export function settledSummary(craft: ForgeCraft): string {
  if (craft.status !== 'Settled') {
    return '';
  }

  switch (craft.destination) {
    case 'Equipped':
      return 'Set aside to arm your own company.';
    case 'Contracted':
      return `Delivered to the kingdom for ${String(craft.feePaidGold)} Gold.`;
    case 'Listed':
      return `Listed for sale at ${String(craft.askingPriceGold)} Gold. Nothing is paid until a buyer takes them.`;
    case 'Retained':
      return 'Held in the settlement, unpromised.';
  }
}
