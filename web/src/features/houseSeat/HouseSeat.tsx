import type { AttentionItem, ChangeEntry, HouseState } from '../../api/types.ts';
import { Art } from '../../components/Art.tsx';
import { EmptyRegion } from '../../components/StateRegion.tsx';
import { Link, useRouter } from '../../app/router.tsx';
import { Household } from '../household/Household.tsx';

/**
 * The home screen.
 *
 * Two shapes, not one screen mutating: a first session whose whole job is
 * making the first move unmissable, and a returning session that answers what
 * changed and what needs attention before the player has to ask.
 */
export function HouseSeat({ state }: { readonly state: HouseState }) {
  const returning = state.changes.length > 0 || state.attention.length > 0;

  return (
    <div className="seat">
      <header className="seat__intro">
        <h1 className="seat__title">{state.settlement.name}</h1>
        <p className="seat__geography">{state.settlement.geography}</p>
      </header>

      {returning ? <ReturningRegions state={state} /> : null}

      <PrimaryTask state={state} firstSession={!returning} />

      <SiteRow state={state} />

      <Household people={state.household} />

      {/* Static prose. Runes are the long-term centre of the game and are not a
          system here — no inventory, no odds, no control, not even a disabled
          one, because a disabled control is an advertisement. */}
      <p className="seat__lore">{state.settlement.loreHint}</p>
    </div>
  );
}

function ReturningRegions({ state }: { readonly state: HouseState }) {
  return (
    <div className="seat__returning">
      <section aria-labelledby="changed-heading" className="panel">
        <h2 id="changed-heading" className="panel__heading">
          What changed
        </h2>
        {state.changes.length === 0 ? (
          <EmptyRegion>
            <p>Nothing has completed since your last visit.</p>
          </EmptyRegion>
        ) : (
          <ul className="change-list">
            {state.changes.map((change) => (
              <ChangeRow key={change.id} change={change} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="attention-heading" className="panel">
        <h2 id="attention-heading" className="panel__heading">
          Needs attention
        </h2>
        {state.attention.length === 0 ? (
          <EmptyRegion>
            <p>Nothing needs you right now.</p>
          </EmptyRegion>
        ) : (
          <ul className="attention-list">
            {state.attention.map((item) => (
              <AttentionRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ChangeRow({ change }: { readonly change: ChangeEntry }) {
  return (
    <li className="change">
      <span aria-hidden="true" className="change__glyph">
        ✓
      </span>
      <span className="change__summary">{change.summary}</span>
    </li>
  );
}

function AttentionRow({ item }: { readonly item: AttentionItem }) {
  // Every attention item is a link straight to where it is resolved, so a
  // two-minute session never has to navigate a hierarchy.
  return (
    <li className="attention">
      <span aria-hidden="true" className="attention__glyph">
        ⚠
      </span>
      <div>
        <Link to={item.href} className="attention__link">
          {item.summary}
        </Link>
        {item.detail !== null && <p className="attention__detail">{item.detail}</p>}
      </div>
    </li>
  );
}

/**
 * The single primary action.
 *
 * Exactly one on the first-session seat. It navigates to the settlement and
 * focuses the building in question — it does **not** start construction, and
 * nothing here implies anything was saved. Committing resources is Prompt 6.
 */
function PrimaryTask({
  state,
  firstSession,
}: {
  readonly state: HouseState;
  readonly firstSession: boolean;
}) {
  const { navigate } = useRouter();

  const candidate = state.buildings.find(
    (building) => building.kind === 'LumberYard' && building.status === 'NotBuilt',
  );

  if (candidate === undefined) {
    // Everything available is under way. Say so rather than manufacture a
    // button to fill the slot — COMPONENTS-AND-STATES.md §4.
    return (
      <section className="panel task" aria-labelledby="task-heading">
        <h2 id="task-heading" className="panel__heading">
          Next
        </h2>
        <p>Everything you can start is already under way.</p>
      </section>
    );
  }

  return (
    <section className="panel task" aria-labelledby="task-heading">
      <h2 id="task-heading" className="panel__heading">
        {firstSession ? 'Your first task' : 'Next'}
      </h2>

      <p className="task__reason">
        The site has timber within reach. A lumber yard keeps every other project
        supplied.
      </p>

      <p className="task__terms">
        <strong>{candidate.displayName}</strong>
        {' · '}
        {candidate.cost.map((entry, index) => (
          <span key={entry.kind}>
            {index > 0 ? ', ' : ''}
            <span className="numeric">{entry.amount}</span>{' '}
            {entry.kind === 'WorkshopSupplies' ? 'Supplies' : entry.kind}
          </span>
        ))}
        {' · '}
        <span className="numeric">{candidate.durationMinutes}</span> minutes
      </p>

      <div className="task__actions">
        <button
          type="button"
          className="button button--primary"
          onClick={() => {
            navigate('/settlement', { state: { focusBuilding: candidate.kind } });
          }}
        >
          Raise the {candidate.displayName}
        </button>
        <Link to="/settlement" className="link">
          See all options
        </Link>
      </div>
    </section>
  );
}

function SiteRow({ state }: { readonly state: HouseState }) {
  return (
    <section aria-labelledby="site-heading" className="panel">
      <h2 id="site-heading" className="panel__heading">
        The site
      </h2>
      <ul className="site-row">
        {state.buildings.map((building) => (
          <li key={building.kind} className="site-plot" data-status={building.status}>
            <Art assetKey={building.artKey} className="site-plot__art" />
            <span className="site-plot__name">{building.displayName}</span>
            <span className="site-plot__status">
              <span aria-hidden="true">
                {building.status === 'Complete' ? '■' : building.status === 'UnderConstruction' ? '▨' : '□'}
              </span>{' '}
              {building.status === 'Complete'
                ? 'Complete'
                : building.status === 'UnderConstruction'
                  ? 'Building'
                  : building.status === 'Previewed'
                    ? 'Later'
                    : 'Not built'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
