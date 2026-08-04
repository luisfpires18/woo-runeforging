import type { CraftOrder } from '../api/types.ts';
import { renderPrimed, type Primer } from './renderApp.tsx';

/**
 * Positions the forge tests share.
 *
 * They live here rather than in one test file so the other can use them without
 * importing a suite — an imported test file registers its own `describe`s in the
 * importing one, and the same assertions would run twice under two names.
 *
 * Every step below is a real command, so a primed position is one the settlement
 * could actually have reached: priming is a shortcut through the interface,
 * never around the rules.
 */

export const standardOrder: CraftOrder = {
  patternId: 'pattern.sword.infantry.arkazian',
  gradeId: 'grade.iron',
  techniqueId: 'technique.standard',
  smithId: 'smith-1',
};

export const hardenedOrder: CraftOrder = {
  ...standardOrder,
  techniqueId: 'technique.hardened',
};

/** Raises the Command Hall, then the Forge, the way a player would. */
export async function raiseTheForge(settlement: Primer): Promise<void> {
  await settlement.begin('CommandHall');
  settlement.advance(30);
  await settlement.procure('Forge');
  await settlement.begin('Forge');
  settlement.advance(40);
}

/** A standing forge with the stores topped up, ready to confirm. */
export async function readyToCraft(settlement: Primer): Promise<void> {
  await raiseTheForge(settlement);
  await settlement.procureCraft(standardOrder);
}

/** Work at the anvil, not yet due. */
export async function craftUnderWay(settlement: Primer): Promise<void> {
  await readyToCraft(settlement);
  await settlement.craft(standardOrder);
}

/** A finished batch, waiting on the one decision that is left. */
export async function finishedBatch(settlement: Primer): Promise<void> {
  await craftUnderWay(settlement);
  settlement.advance(45);
}

export const withForge = renderPrimed(raiseTheForge);
export const withReadyForge = renderPrimed(readyToCraft);
export const withCraftUnderWay = renderPrimed(craftUnderWay);
export const withFinishedBatch = renderPrimed(finishedBatch);

/** A batch that has already gone where it was sent. */
export const settledAs = (destination: 'Equipped' | 'Contracted' | 'Listed' | 'Retained') =>
  renderPrimed(async (settlement) => {
    await finishedBatch(settlement);
    await settlement.send('craft-1', destination);
  });
