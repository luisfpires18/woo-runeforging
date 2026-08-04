import type { CSSProperties } from 'react';

import type { BuildingKind } from '../api/types.ts';
import scene from '../assets/environment/outpost.svg';

/**
 * The outpost, drawn once.
 *
 * The scene is terrain, fortification and light — no building is painted into
 * it. The seven sites are laid over the top at fixed anchors, so the same site
 * stands in the same place on every screen that shows the outpost, and the
 * artwork stays true as the settlement changes.
 *
 * Decorative throughout: the ground carries no information, and everything a
 * player must read sits in the plots layered above it.
 *
 * The ground is rendered as a sibling of the plots rather than as their
 * container. On a wide screen it is positioned behind them; on a narrow one it
 * becomes a banner and the command ledge is ordered between the two, which is
 * only possible while all three are children of the same flex container.
 */

/**
 * Where each site stands, as a percentage of the frame.
 *
 * Chosen so the plots follow the terraces cut into the artwork and no two
 * overlap at the desktop plot size. Read back to front, it is also roughly the
 * order the eye should travel: the cut face and the high ground first, the
 * working ground last.
 */
const anchors: Readonly<Record<BuildingKind, { readonly x: number; readonly y: number }>> = {
  Quarry: { x: 10, y: 30 },
  Storehouse: { x: 31, y: 20 },
  CommandHall: { x: 51, y: 38 },
  Mine: { x: 88, y: 21 },
  Barracks: { x: 71, y: 54 },
  LumberYard: { x: 24, y: 68 },
  Forge: { x: 87, y: 72 },
};

/**
 * The inline anchor for one site.
 *
 * Two custom properties rather than `left` and `top` directly, so the
 * stylesheet decides whether they are used at all — on a narrow screen the
 * plots leave the scene and stack, and the anchors are simply ignored.
 */
export function siteAnchor(kind: BuildingKind): CSSProperties {
  const anchor = anchors[kind];

  return {
    '--site-x': `${String(anchor.x)}%`,
    '--site-y': `${String(anchor.y)}%`,
  } as CSSProperties;
}

export function SceneGround() {
  return (
    <div
      className="scene__ground"
      aria-hidden="true"
      style={{ '--scene-image': `url(${scene})` } as CSSProperties}
    >
      <span className="scene__vignette" />
    </div>
  );
}
