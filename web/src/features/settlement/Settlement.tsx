import { useEffect, useRef, useState } from 'react';

import type { Building, BuildingKind, SettlementState } from '../../api/types.ts';
import { BuildingRow } from '../../components/BuildingRow.tsx';
import { SceneGround } from '../../components/SettlementScene.tsx';
import { useRouter } from '../../app/router.tsx';

/**
 * The site and its buildings.
 *
 * All seven stand in the scene — five that can be raised, and Barracks and
 * Forge as previews carrying the reason they are not yet available. The player
 * sees the whole outpost and what it will become; growth needs somewhere
 * visible to go.
 *
 * Prompt 5 shows the sites and their terms. It does **not** implement the
 * commit flow — reserving resources, resolving shortages and confirming a
 * construction are Prompt 6. Choosing a plot here changes which site the
 * command ledge describes, and nothing else.
 */
export function Settlement({ state }: { readonly state: SettlementState }) {
  const { navigationState } = useRouter();
  const focusTarget = readFocusTarget(navigationState);
  const rowRef = useRef<HTMLLIElement>(null);

  // Only a click sets this. What the ledge describes is derived, so arriving
  // with a target needs no effect and no cascading render: the target wins
  // until the player chooses otherwise, and arriving without one still has to
  // describe something rather than open on an empty panel.
  const [chosen, setChosen] = useState<BuildingKind | null>(null);

  useEffect(() => {
    if (focusTarget !== null) {
      rowRef.current?.focus();
    }
  }, [focusTarget]);

  const selectedKind = chosen ?? focusTarget ?? state.buildings[0]?.kind ?? null;
  const selected =
    state.buildings.find((building) => building.kind === selectedKind) ?? null;

  return (
    <div className="settlement">
      {/* The settlement has one name, so the stage belongs in the label rather
          than trailing the title as a second half of it. */}
      <header className="intro">
        <p className="intro__eyebrow">The site · {state.settlement.stage}</p>
        <h1 className="intro__title">{state.settlement.name}</h1>
        <p className="intro__prose">{state.settlement.geography}</p>
      </header>

      <div className="theatre">
        <SceneGround />

        <section aria-labelledby="buildings-heading" className="site">
          <h2 id="buildings-heading" className="site__heading">
            Buildings
          </h2>
          <ul className="building-list">
            {state.buildings.map((building) => (
              <BuildingRow
                key={building.kind}
                building={building}
                asOfUtc={state.asOfUtc}
                selected={building.kind === selectedKind}
                onSelect={setChosen}
                ref={building.kind === focusTarget ? rowRef : undefined}
              />
            ))}
          </ul>
        </section>

        <SiteOrders building={selected} asOfUtc={state.asOfUtc} />
      </div>
    </div>
  );
}

/**
 * The command ledge.
 *
 * It reports the chosen site and what raising it would take. There is no
 * control on it, because there is nothing here to commit: the terms are stated
 * and the decision belongs to a prompt that has not been built.
 */
function SiteOrders({
  building,
  asOfUtc,
}: {
  readonly building: Building | null;
  readonly asOfUtc: string;
}) {
  if (building === null) {
    return null;
  }

  const remaining =
    building.completesAtUtc === null
      ? null
      : Math.max(
          0,
          Math.ceil(
            (new Date(building.completesAtUtc).getTime() - new Date(asOfUtc).getTime()) /
              60_000,
          ),
        );

  return (
    <section aria-labelledby="orders-heading" className="orders">
      <div className="orders__head">
        <h2 id="orders-heading" className="orders__heading">
          Selected site
        </h2>
        <p className="orders__title">{building.displayName}</p>
      </div>

      <div className="orders__body">
        <p className="orders__prose">{building.description}</p>
        <p className="orders__state">{stateLine(building, remaining)}</p>
      </div>

      {(building.status === 'NotBuilt' || building.status === 'Previewed') && (
        <div className="orders__terms">
          <h3 className="orders__terms-heading">Requires</h3>
          <ul className="terms">
            {building.cost.map((entry) => (
              <li key={entry.kind} className="terms__entry">
                <span className="numeric terms__amount">{entry.amount}</span>
                <span className="terms__unit">
                  {entry.kind === 'WorkshopSupplies' ? 'Supplies' : entry.kind}
                </span>
              </li>
            ))}
            <li className="terms__entry terms__entry--time">
              <span className="numeric terms__amount">{building.durationMinutes}</span>
              <span className="terms__unit">Minutes</span>
            </li>
          </ul>
        </div>
      )}
    </section>
  );
}

/** What is true of this site right now, in one sentence. */
function stateLine(building: Building, remaining: number | null): string {
  switch (building.status) {
    case 'Complete':
      return building.yieldSummary === null
        ? 'Raised and standing.'
        : `Raised and standing. ${building.yieldSummary}.`;
    case 'UnderConstruction':
      return remaining === null || remaining === 0
        ? 'Work on the ground is finishing.'
        : `Work is under way — ${String(remaining)} minutes remain.`;
    case 'Previewed':
      return building.unavailableReason === null
        ? 'Not yet within the settlement’s reach.'
        : `${building.unavailableReason} before this ground can be worked.`;
    default:
      return 'The ground is surveyed and the terms are set. Nothing has been set in motion here.';
  }
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
