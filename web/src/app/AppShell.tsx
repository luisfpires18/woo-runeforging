import type { CSSProperties, ReactNode } from 'react';

import type { HouseState } from '../api/types.ts';
import { useHouseState } from '../api/HouseStateProvider.tsx';
import ridge from '../assets/environment/ridge.svg';
import { Art } from '../components/Art.tsx';
import { ResourceBar } from '../components/ResourceBar.tsx';
import { Link, useRouter } from './router.tsx';

const areas = [
  { path: '/', label: 'Seat' },
  { path: '/settlement', label: 'Settlement' },
] as const;

/**
 * The command frame: one HUD band, and a rail joined to it.
 *
 * House identity, settlement state and the House's stores share a single
 * stone band, because they answer one question — what do I hold, and where.
 * The rail hangs off the bottom edge of that band with no seam, so navigation
 * reads as part of the fortress interface rather than as a list beside it.
 *
 * Navigation lists only areas that exist. Forge, Army and Reports are later
 * prompts and are absent rather than disabled — a greyed-out tab teases a
 * system the player cannot reach and cannot work toward.
 */
export function AppShell({
  state,
  offline,
  children,
}: {
  readonly state: HouseState | null;
  readonly offline: boolean;
  readonly children: ReactNode;
}) {
  const { path } = useRouter();
  const { advanceTime } = useHouseState();

  return (
    <div className="shell">
      {/* The pass above Ashen Reach. Decorative depth, never information. */}
      <div
        className="shell__backdrop"
        aria-hidden="true"
        style={{ '--backdrop-image': `url(${ridge})` } as CSSProperties}
      />

      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {offline && (
        <div className="offline" role="status">
          You are offline. What you can see is the last we heard from the House.
        </div>
      )}

      <header className="hud">
        <div className="hud__inner">
          <div className="hud__identity">
            {state !== null && (
              <Art
                assetKey={state.house.crestKey}
                className="hud__crest"
                factionFallback={false}
              />
            )}
            <div className="hud__names">
              <span className="hud__house">{state?.house.name ?? 'House'}</span>
              <span className="hud__settlement">
                {state?.settlement.name}
                {state !== null && <span className="hud__stage">{state.settlement.stage}</span>}
              </span>
            </div>
          </div>

          {state !== null && <ResourceBar resources={state.resources} />}
        </div>
      </header>

      <div className="shell__body">
        <nav className="rail" aria-label="Areas">
          <ul className="rail__list">
            {areas.map((area) => {
              const current = path === area.path;

              return (
                <li key={area.path}>
                  <Link
                    to={area.path}
                    className={`nav-link${current ? ' nav-link--current' : ''}`}
                    current={current}
                  >
                    {current && <span aria-hidden="true" className="nav-link__marker" />}
                    {area.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main id="main" className="shell__main">
          {children}
        </main>
      </div>

      {advanceTime !== null && (
        <div className="dev-tools">
          <span className="dev-tools__label">Testing aid — not part of the game</span>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              advanceTime(20);
            }}
          >
            Advance 20 minutes
          </button>
        </div>
      )}
    </div>
  );
}
