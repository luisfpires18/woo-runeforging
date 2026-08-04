import type { ResourceBalance, ResourceCostEntry, Shortfall } from './types.ts';

/**
 * Buying what the settlement is short of, rather than gathering it.
 *
 * Shared by construction and forging so the two cannot drift: a player short of
 * 20 Timber for a building and short of 20 Timber for a craft is short in the
 * same way, at the same price, with the same all-or-nothing act to resolve it.
 */

/**
 * What buying a shortfall costs, per missing unit.
 *
 * A PLACEHOLDER. Real pricing is bounded demand against a real economy and
 * belongs to the authoritative economy; this exists so a player short of 20
 * Timber has something to do about it other than wait for a system that does not
 * exist yet.
 */
export const goldPerMissingUnit = 1;

/**
 * What the balances would be after paying a cost, whether or not it is
 * affordable. A negative amount is a shortage, and is meant to be visible.
 */
export function balancesAfter(
  resources: readonly ResourceBalance[],
  cost: readonly ResourceCostEntry[],
): ResourceBalance[] {
  const spend = new Map(cost.map((entry) => [entry.kind, entry.amount]));

  return resources.map((balance) => ({
    ...balance,
    amount: balance.amount - (spend.get(balance.kind) ?? 0),
  }));
}

/**
 * What is missing, and what buying it would cost.
 *
 * **Gold is never itself a shortfall.** There is no recursive way to procure the
 * thing procurement is paid in, so a Gold shortage is reported as a Gold
 * shortage by the ordinary affordability check instead.
 */
export function shortfallsFrom(after: readonly ResourceBalance[]): Shortfall[] {
  return after
    .filter((balance) => balance.kind !== 'Gold' && balance.amount < 0)
    .map((balance) => ({
      kind: balance.kind,
      displayName: balance.displayName,
      short: -balance.amount,
      goldPrice: -balance.amount * goldPerMissingUnit,
    }));
}

export function totalGoldPriceOf(shortfalls: readonly Shortfall[]): number {
  return shortfalls.reduce((total, shortfall) => total + shortfall.goldPrice, 0);
}
