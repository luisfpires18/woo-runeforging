import { useEffect, useRef } from 'react';

import type { BuildingKind, HouseState } from '../../api/types.ts';
import { BuildingRow } from '../../components/BuildingRow.tsx';
import { useRouter } from '../../app/router.tsx';

/**
 * The site and its buildings.
 *
 * All seven are always listed — five that can be raised, and Barracks and Forge
 * as previews with the reason they are not yet available. The player sees the
 * whole site and what it will become; growth needs somewhere visible to go.
 *
 * Prompt 5 shows buildings and their costs. It does **not** implement the
 * commit flow — reserving resources, resolving shortages and confirming a
 * construction are Prompt 6.
 */
export function Settlement({ state }: { readonly state: HouseState }) {
  const { navigationState } = useRouter();
  const focusTarget = readFocusTarget(navigationState);
  const rowRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (focusTarget !== null) {
      rowRef.current?.focus();
    }
  }, [focusTarget]);

  return (
    <div className="settlement">
      <header className="settlement__intro">
        <h1 className="settlement__title">
          {state.settlement.name} — {state.settlement.stage}
        </h1>
        <p className="settlement__geography">{state.settlement.geography}</p>
      </header>

      <section aria-labelledby="buildings-heading" className="panel">
        <h2 id="buildings-heading" className="panel__heading">
          Buildings
        </h2>
        <ul className="building-list">
          {state.buildings.map((building) => (
            <BuildingRow
              key={building.kind}
              building={building}
              asOfUtc={state.asOfUtc}
              highlighted={building.kind === focusTarget}
              ref={building.kind === focusTarget ? rowRef : undefined}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function readFocusTarget(navigationState: unknown): BuildingKind | null {
  if (
    typeof navigationState === 'object' &&
    navigationState !== null &&
    'focusBuilding' in navigationState
  ) {
    const { focusBuilding } = navigationState;
    return typeof focusBuilding === 'string' ? (focusBuilding as BuildingKind) : null;
  }

  return null;
}
