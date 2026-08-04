/**
 * Asset resolution with a terminating fallback chain.
 *
 *   specific art  →  faction placeholder  →  heraldic token
 *
 * The last link is guaranteed present, so **missing art can never block play**.
 * `buildings/forge` has no file on purpose: it is how the missing-asset state
 * stays real and testable rather than theoretical.
 */

import arkazia from './factions/arkazia.svg';
import arkazianToken from './heraldry/arkazian-token.svg';
import barracks from './buildings/barracks.svg';
import commandHall from './buildings/command-hall.svg';
import lumberYard from './buildings/lumber-yard.svg';
import mine from './buildings/mine.svg';
import quarry from './buildings/quarry.svg';
import storehouse from './buildings/storehouse.svg';

/** The terminal fallback. Always present. */
export const heraldicToken = arkazianToken;

const known: Readonly<Record<string, string>> = {
  'heraldry/arkazian-token': arkazianToken,
  'factions/arkazia': arkazia,
  'buildings/command-hall': commandHall,
  'buildings/storehouse': storehouse,
  'buildings/lumber-yard': lumberYard,
  'buildings/quarry': quarry,
  'buildings/mine': mine,
  'buildings/barracks': barracks,
  // 'buildings/forge' — deliberately absent.
  // 'people/halvard-stenn' — deliberately absent; portraits are a later prompt.
};

export interface ResolvedAsset {
  readonly src: string;
  /** True when the specific asset was missing and a fallback was used. */
  readonly isFallback: boolean;
}

/**
 * Resolves an asset key, falling back rather than failing.
 *
 * @param key the requested asset
 * @param factionFallback whether a faction placeholder is an acceptable
 *        intermediate step. Portraits go straight to the heraldic token —
 *        a picture of a fortress is not a picture of a person.
 */
export function resolveAsset(key: string, factionFallback = true): ResolvedAsset {
  const exact = known[key];

  if (exact !== undefined) {
    return { src: exact, isFallback: false };
  }

  if (factionFallback) {
    return { src: arkazia, isFallback: true };
  }

  return { src: heraldicToken, isFallback: true };
}
