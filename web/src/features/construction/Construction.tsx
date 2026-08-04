import { useEffect, useRef } from 'react';

import { quoteFor } from '../../api/construction.ts';
import { useSettlementState } from '../../api/SettlementStateProvider.tsx';
import type {
  BuildingKind,
  ConstructionQuote,
  SettlementState,
} from '../../api/types.ts';
import { Link, useRouter } from '../../app/router.tsx';
import { useTelemetry } from '../../telemetry/TelemetryProvider.tsx';
import type { AbandonPoint } from '../../telemetry/types.ts';

/**
 * The confirm step — `WIREFRAMES.md` §5.
 *
 * Everything the player needs in order to decide, before they commit: what it
 * costs, what it leaves, how long it takes, and that it cannot be undone. It is
 * a route rather than a dialog, so it has an address, back works, and refresh
 * returns here (`NAVIGATION.md` §4).
 *
 * Committing spends the whole cost and starts the work in one transition. There
 * is no cancel afterwards, which is why the boundary is stated before rather
 * than discovered after.
 */
export function Construction({
  state,
  kind,
  offline,
}: {
  readonly state: SettlementState;
  readonly kind: BuildingKind | null;
  readonly offline: boolean;
}) {
  const { navigate } = useRouter();
  const { commit, beginConstruction, procureShortfalls, dismissCommitFailure } =
    useSettlementState();
  const telemetry = useTelemetry();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const quote = kind === null ? null : quoteFor(state, kind);

  // Focus moves in on arrival — ACCESSIBILITY.md §2. The heading rather than
  // the confirm, so a screen reader hears what is being decided first.
  useEffect(() => {
    headingRef.current?.focus();
  }, [kind]);

  const leave = (at: AbandonPoint) => {
    if (kind !== null) {
      telemetry.record({ name: 'construction.abandoned', kind, at });
    }

    dismissCommitFailure();
    navigate('/settlement', { state: { focusBuilding: kind } });
  };

  // Esc cancels, the same as the button.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        leave('cancelled');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  });

  if (kind === null || quote === null) {
    return (
      <div className="construction">
        <Breadcrumb name="Unknown site" />
        <header className="intro">
          <p className="intro__eyebrow">Not found</p>
          <h1 className="intro__title" ref={headingRef} tabIndex={-1}>
            No such site
          </h1>
        </header>
        <div className="theatre theatre--flat">
          <div className="orders orders--commit">
            <div className="orders__body">
              <p className="orders__state">
                The settlement has no site by that name. It may have been renamed, or
                the address may be mistyped.
              </p>
            </div>
            <div className="task__actions">
              <Link to="/settlement" className="button button--secondary">
                Back to the settlement
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const working = commit.phase === 'working' && commit.kind === kind;
  const failed = commit.phase === 'failed' && commit.kind === kind ? commit.message : null;
  const short = quote.shortfalls.length > 0;

  return (
    <div className="construction">
      <Breadcrumb name={quote.building.displayName} />

      <header className="intro">
        <p className="intro__eyebrow">Construction</p>
        <h1 className="intro__title" ref={headingRef} tabIndex={-1}>
          {quote.ineligibility === null
            ? `Raise the ${quote.building.displayName}`
            : quote.building.displayName}
        </h1>
        <p className="intro__prose">{quote.building.description}</p>
      </header>

      <div className="theatre theatre--flat">
        <section aria-labelledby="terms-heading" className="terms-panel">
          <h2 id="terms-heading" className="visually-hidden">
            Terms
          </h2>

          {quote.ineligibility === null ? (
            <CostAndAfter quote={quote} />
          ) : (
            <p className="orders__state">{ineligibleLine(quote)}</p>
          )}
        </section>

        {/* The crimson tab is the settlement's authority to act. A screen with
            nothing to confirm has no authority to wear. */}
        <section
          aria-labelledby="commit-heading"
          className={`orders orders--commit${quote.ineligibility === null ? ' orders--task' : ''}`}
        >
          <div className="orders__head">
            <h2 id="commit-heading" className="orders__heading">
              {quote.ineligibility === null ? 'Confirm' : 'Nothing to confirm'}
            </h2>
          </div>

          <div className="orders__body">
            {quote.ineligibility === null && !short && (
              <p className="orders__warning">Once begun, this cannot be cancelled.</p>
            )}

            {short && (
              <Shortfalls
                quote={quote}
                kind={kind}
                offline={offline}
                working={working}
                onProcure={() => void procureShortfalls(kind)}
              />
            )}

            {/* The shell's offline banner already carries role="status"; a
                second live region announcing the same fact would say it
                twice. This is the reason beside the control it disables. */}
            {offline && (
              <p className="orders__state">
                You are offline. Nothing can be committed until the settlement answers
                again.
              </p>
            )}

            {failed !== null && (
              <p className="orders__rejection" role="alert">
                {failed}
              </p>
            )}
          </div>

          <div className="task__actions">
            {quote.ineligibility === null && !short && (
              <button
                type="button"
                className="button button--primary"
                disabled={working || offline}
                onClick={() => {
                  // Success is confirmed in place: back at the settlement, with
                  // the plot changed and the resource strip dropped. No modal,
                  // and no toast standing in for the evidence.
                  void beginConstruction(kind).then((accepted) => {
                    if (accepted) {
                      navigate('/settlement', { state: { focusBuilding: kind } });
                    }
                  });
                }}
              >
                {working ? 'Beginning…' : 'Begin construction'}
              </button>
            )}

            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                leave(short ? 'shortage-unresolved' : 'cancelled');
              }}
            >
              Cancel
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Breadcrumb({ name }: { readonly name: string }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <Link to="/settlement" className="link">
        Settlement
      </Link>
      <span aria-hidden="true" className="breadcrumb__separator">
        ›
      </span>
      <span aria-current="page">{name}</span>
    </nav>
  );
}

/**
 * Cost beside the balance it leaves.
 *
 * The "after" column is the point: a cost alone does not tell the player
 * whether they can still afford the next thing.
 */
function CostAndAfter({ quote }: { readonly quote: ConstructionQuote }) {
  const spend = new Map(quote.cost.map((entry) => [entry.kind, entry.amount]));

  return (
    <>
      <table className="ledger-table">
        <caption className="visually-hidden">
          What raising it costs, and what each balance would be afterwards
        </caption>
        <thead>
          <tr>
            <th scope="col">Cost</th>
            <th scope="col">Amount</th>
            <th scope="col">After</th>
          </tr>
        </thead>
        <tbody>
          {quote.after
            .filter((balance) => spend.has(balance.kind))
            .map((balance) => (
              <tr key={balance.kind} data-short={balance.amount < 0 ? 'true' : 'false'}>
                <th scope="row">{balance.displayName}</th>
                <td className="numeric">{spend.get(balance.kind)}</td>
                <td className="numeric ledger-table__after">
                  {balance.amount + (spend.get(balance.kind) ?? 0)}
                  <span aria-hidden="true"> → </span>
                  <span className="visually-hidden"> becomes </span>
                  <strong>{balance.amount}</strong>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <p className="orders__duration">
        <span className="orders__label">Duration</span>
        <span className="numeric">{quote.durationMinutes}</span> minutes · complete at{' '}
        <span className="numeric">{clockTime(quote.completesAtUtc)}</span>
      </p>
    </>
  );
}

/**
 * The shortfall notice, which **replaces** the confirm rather than sitting
 * beside a disabled one (`COMPONENTS-AND-STATES.md` §1).
 *
 * It names the exact amounts, the total price and what is left, and buys all of
 * it at once — a player choosing per-resource quantities is doing arithmetic the
 * screen already did.
 */
function Shortfalls({
  quote,
  kind,
  offline,
  working,
  onProcure,
}: {
  readonly quote: ConstructionQuote;
  readonly kind: BuildingKind;
  readonly offline: boolean;
  readonly working: boolean;
  readonly onProcure: () => void;
}) {
  const telemetry = useTelemetry();

  const signature = quote.shortfalls
    .map((shortfall) => `${shortfall.kind}:${String(shortfall.short)}`)
    .join(',');

  // Keyed on the shortage itself, so rerenders and StrictMode's double-invoke
  // report it once — and a shortage that changes is a new presentation.
  useEffect(() => {
    telemetry.recordOnce(`shortage:${kind}:${signature}`, {
      name: 'shortage.shown',
      kind,
      short: quote.shortfalls.map((shortfall) => shortfall.kind),
      goldPrice: quote.totalGoldPrice,
    });
  }, [telemetry, kind, signature, quote.shortfalls, quote.totalGoldPrice]);

  const affordable = quote.goldAfterProcurement >= 0;

  return (
    <div className="shortfall">
      <p className="shortfall__summary">
        <span aria-hidden="true" className="shortfall__glyph">
          ⚠
        </span>{' '}
        Short{' '}
        {quote.shortfalls.map((shortfall, index) => (
          <span key={shortfall.kind}>
            {index > 0 ? (index === quote.shortfalls.length - 1 ? ' and ' : ', ') : ''}
            <span className="numeric">{shortfall.short}</span> {shortfall.displayName}
          </span>
        ))}
        .
      </p>

      <p className="shortfall__price">
        {affordable ? (
          <>
            Procuring costs <span className="numeric">{quote.totalGoldPrice}</span> Gold,
            leaving <span className="numeric">{quote.goldAfterProcurement}</span>.
          </>
        ) : (
          <>
            Procuring would cost <span className="numeric">{quote.totalGoldPrice}</span>{' '}
            Gold, and the settlement does not hold that much.
          </>
        )}
      </p>

      <button
        type="button"
        className="button button--secondary"
        disabled={working || offline || !affordable}
        onClick={onProcure}
      >
        {working ? 'Procuring…' : 'Procure the shortfall'}
      </button>

      {offline && (
        <p className="shortfall__reason">Procuring needs the settlement to answer.</p>
      )}
    </div>
  );
}

/** What is true of a site that cannot be raised, in one sentence. */
function ineligibleLine(quote: ConstructionQuote): string {
  switch (quote.ineligibility) {
    case 'AlreadyStanding':
      return quote.building.yieldSummary === null
        ? `The ${quote.building.displayName} is already standing.`
        : `The ${quote.building.displayName} is already standing. ${quote.building.yieldSummary}.`;
    case 'UnderConstruction':
      return `Work on the ${quote.building.displayName} is already under way, and is due at ${clockTime(quote.building.completesAtUtc ?? quote.completesAtUtc)}.`;
    case 'PrerequisiteUnmet':
      return quote.building.unavailableReason === null
        ? `The ${quote.building.displayName} cannot be raised yet.`
        : `${quote.building.unavailableReason} before this ground can be worked.`;
    default:
      return `The ${quote.building.displayName} cannot be raised.`;
  }
}

/** "14:35" — the completion time, not only the duration. */
function clockTime(iso: string): string {
  const at = new Date(iso);

  return `${String(at.getUTCHours()).padStart(2, '0')}:${String(at.getUTCMinutes()).padStart(2, '0')}`;
}
