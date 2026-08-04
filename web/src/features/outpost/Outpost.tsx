import type {
  AttentionItem,
  Building,
  BuildingKind,
  ChangeEntry,
  SettlementState,
} from '../../api/types.ts';
import { Art } from '../../components/Art.tsx';
import { SceneGround, siteAnchor } from '../../components/SettlementScene.tsx';
import { EmptyRegion } from '../../components/StateRegion.tsx';
import { Link, useRouter } from '../../app/router.tsx';
import { Residents } from '../residents/Residents.tsx';

/**
 * The home screen.
 *
 * The outpost itself is the screen. The settlement fills the frame, the seven
 * sites stand on their own ground inside it, and the one thing worth doing is
 * stated on a ledge welded to the bottom of that view rather than floated
 * beside it as a card.
 *
 * Two shapes, not one screen mutating: a first session whose whole job is
 * making the first move unmissable, and a returning session that answers what
 * changed and what needs attention before the player has to ask.
 */
export function Outpost({ state }: { readonly state: SettlementState }) {
  const returning = state.changes.length > 0 || state.attention.length > 0;
  const candidate = nextTask(state.buildings);

  return (
    <div className="outpost">
      <header className="intro">
        {/* The label names the screen, not the settlement — the title below it
            and the HUD above it are already saying the name. */}
        <p className="intro__eyebrow">Overview</p>
        <h1 className="intro__title">{state.settlement.name}</h1>
        <p className="intro__prose">{state.settlement.geography}</p>
      </header>

      {/* Scene and ledge are one object. The decision belongs to the place it
          is about, not to a panel somewhere else on the page. */}
      <div className="theatre">
        <SceneGround />
        <SiteRow state={state} focus={candidate?.kind ?? null} />
        <PrimaryTask candidate={candidate} firstSession={!returning} />
      </div>

      {/* Everything below the fold is reference: what happened, who is here,
          and what the stone remembers. Separators, not four more boxes. */}
      <div className="ledger">
        {returning ? <ReturningRegions state={state} /> : null}
        <Residents people={state.residents} />
        {/* Static prose. Runes are the long-term centre of the game and are
            not a system here — no inventory, no odds, no control, not even a
            disabled one, because a disabled control is an advertisement. */}
        <p className="outpost__lore">{state.settlement.loreHint}</p>
      </div>
    </div>
  );
}

/** The Lumber Yard, while it is still unbuilt. Nothing else is offered. */
function nextTask(buildings: readonly Building[]): Building | undefined {
  return buildings.find(
    (building) => building.kind === 'LumberYard' && building.status === 'NotBuilt',
  );
}

function ReturningRegions({ state }: { readonly state: SettlementState }) {
  return (
    <>
      <section aria-labelledby="changed-heading" className="record">
        <h2 id="changed-heading" className="record__heading">
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

      <section aria-labelledby="attention-heading" className="record">
        <h2 id="attention-heading" className="record__heading">
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
    </>
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
 * The single primary action, on the ledge below the outpost.
 *
 * Exactly one on the first-session outpost. It navigates to the settlement and
 * focuses the site in question — it does **not** start construction, and
 * nothing here implies anything was saved. Committing resources is Prompt 6.
 */
function PrimaryTask({
  candidate,
  firstSession,
}: {
  readonly candidate: Building | undefined;
  readonly firstSession: boolean;
}) {
  const { navigate } = useRouter();

  if (candidate === undefined) {
    // Everything available is under way. Say so rather than manufacture a
    // button to fill the slot — COMPONENTS-AND-STATES.md §4.
    return (
      <section className="orders" aria-labelledby="task-heading">
        <div className="orders__head">
          <h2 id="task-heading" className="orders__heading">
            Next
          </h2>
        </div>
        <div className="orders__body">
          <p className="orders__prose">Everything you can start is already under way.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="orders orders--task" aria-labelledby="task-heading">
      <div className="orders__head">
        <h2 id="task-heading" className="orders__heading">
          {firstSession ? 'Your first task' : 'Next'}
        </h2>
        <p className="orders__title">{candidate.displayName}</p>
      </div>

      <div className="orders__body">
        <p className="orders__prose">
          The site has timber within reach. A lumber yard keeps every other project
          supplied.
        </p>
        <p className="orders__terms-line">
          {candidate.cost.map((entry, index) => (
            <span key={entry.kind}>
              {index > 0 ? ' · ' : ''}
              <span className="numeric">{entry.amount}</span>{' '}
              {entry.kind === 'WorkshopSupplies' ? 'Supplies' : entry.kind}
            </span>
          ))}
          {' · '}
          <span className="numeric">{candidate.durationMinutes}</span> minutes
        </p>
      </div>

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

/**
 * The outpost, seen whole.
 *
 * Compact markers rather than the settlement screen's full plates: from the
 * outpost you are reading the site at a glance, not inspecting one part of it.
 */
function SiteRow({
  state,
  focus,
}: {
  readonly state: SettlementState;
  readonly focus: BuildingKind | null;
}) {
  return (
    <section aria-labelledby="site-heading" className="site">
      <h2 id="site-heading" className="site__heading">
        The site
      </h2>
      <ul className="site-row">
        {state.buildings.map((building) => (
          <li
            key={building.kind}
            className="site-plot"
            data-status={building.status}
            data-focus={building.kind === focus ? 'true' : 'false'}
            style={siteAnchor(building.kind)}
          >
            <span className="site-plot__frame">
              <Art assetKey={building.artKey} className="site-plot__art" />
              <span aria-hidden="true" className="site-plot__scaffold" />
            </span>
            <span className="site-plot__name">{building.displayName}</span>
            <span className="site-plot__status">
              <span aria-hidden="true">
                {building.status === 'Complete'
                  ? '■'
                  : building.status === 'UnderConstruction'
                    ? '▨'
                    : '□'}
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
