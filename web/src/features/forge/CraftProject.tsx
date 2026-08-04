import { useEffect, useRef, useState } from 'react';

import { craftBlockOf, craftQuoteFor, defaultOrder, type CraftBlock } from '../../api/forging.ts';
import { useSettlementState } from '../../api/SettlementStateProvider.tsx';
import type { CraftOrder, CraftQuote, ForgeState, SettlementState } from '../../api/types.ts';
import { Link, useRouter } from '../../app/router.tsx';

/**
 * The craft form and its confirm — `WIREFRAMES.md` §6.
 *
 * Everything the player needs in order to decide, before they commit: what it
 * costs, what it leaves, how long it takes, **what quality is guaranteed**, what
 * the swords will do in the line, and that a destination decision is coming.
 *
 * There is no probability language anywhere on this screen — no odds, no
 * chance, no percentage against an outcome. Ordinary forging has a floor and
 * delivers it. That is what makes the eventual Runeforging risk panel land as a
 * change in kind rather than as more of the same.
 */
export function CraftProject({
  state,
  offline,
}: {
  readonly state: SettlementState;
  readonly offline: boolean;
}) {
  const { forge } = state;
  const { navigate } = useRouter();
  const { commit, beginCraft, procureCraftShortfalls, dismissCommitFailure } =
    useSettlementState();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const [chosen, setChosen] = useState<CraftOrder | null>(null);

  const order = chosen ?? defaultOrder(forge);
  const block = craftBlockOf(forge);
  const quote = order === null ? null : craftQuoteFor(state, order);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Esc leaves, the same as Cancel. Nothing has been spent, so nothing is lost.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismissCommitFailure();
        navigate('/forge');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  });

  const working = commit.phase === 'working' && commit.subject.of === 'craft';
  const failed =
    commit.phase === 'failed' && commit.subject.of === 'craft' ? commit.message : null;
  const short = quote !== null && quote.shortfalls.length > 0;

  return (
    <div className="forge">
      <Breadcrumb />

      <header className="intro">
        <p className="intro__eyebrow">New project</p>
        <h1 className="intro__title" ref={headingRef} tabIndex={-1}>
          {block === null ? 'Forge the swords' : 'The forge cannot take this on'}
        </h1>
        <p className="intro__prose">{forge.request.detail}</p>
      </header>

      <div className="theatre">
        {block !== null && <Blocked block={block} forge={forge} />}

        {order !== null && quote !== null && (
          <>
            <Selection
              forge={forge}
              order={order}
              // A blocked screen still shows what would be chosen, read-only:
              // seeing the terms is how a player learns what to work toward.
              disabled={block !== null}
              onChange={setChosen}
            />
            <Terms quote={quote} />
          </>
        )}

        {block === null && quote !== null && order !== null && (
          <section aria-labelledby="commit-heading" className="orders orders--commit orders--task">
            <div className="orders__head">
              <h2 id="commit-heading" className="orders__heading">
                Confirm
              </h2>
            </div>

            <div className="orders__body">
              {!short && (
                <p className="orders__warning">Once begun, this cannot be cancelled.</p>
              )}

              {short && (
                <Shortfalls
                  quote={quote}
                  offline={offline}
                  working={working}
                  onProcure={() => void procureCraftShortfalls(order)}
                />
              )}

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
              {!short && (
                <button
                  type="button"
                  className="button button--primary"
                  disabled={working || offline}
                  onClick={() => {
                    void beginCraft(order).then((accepted) => {
                      if (accepted) {
                        navigate('/forge');
                      }
                    });
                  }}
                >
                  {working ? 'Beginning…' : 'Begin the craft'}
                </button>
              )}

              <button
                type="button"
                className="button button--secondary"
                onClick={() => {
                  dismissCommitFailure();
                  navigate('/forge');
                }}
              >
                Cancel
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Breadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <Link to="/forge" className="link">
        Forge
      </Link>
      <span aria-hidden="true" className="breadcrumb__separator">
        ›
      </span>
      <span aria-current="page">New project</span>
    </nav>
  );
}

/**
 * What is true of a forge that cannot start this craft, and the way onward.
 *
 * Each of these is reachable by typing the address, so each states its own case
 * and offers no confirm rather than presenting one that would be refused.
 */
function Blocked({
  block,
  forge,
}: {
  readonly block: CraftBlock;
  readonly forge: ForgeState;
}) {
  const { line, action } = blockedCopy(block, forge);

  return (
    <section aria-labelledby="blocked-heading" className="orders orders--commit">
      <div className="orders__head">
        <h2 id="blocked-heading" className="orders__heading">
          Nothing to confirm
        </h2>
      </div>
      <div className="orders__body">
        <p className="orders__state">{line}</p>
      </div>
      <div className="task__actions">
        <Link to={action.to} className="button button--secondary">
          {action.label}
        </Link>
      </div>
    </section>
  );
}

function blockedCopy(block: CraftBlock, forge: ForgeState) {
  switch (block) {
    case 'ForgeNotBuilt':
      return {
        line: 'The settlement has no forge yet. Raise it and the smith can begin.',
        action: { to: '/settlement/forge', label: 'Raise the Forge' },
      };
    case 'CraftUnderWay':
      return {
        line: 'Work is already under way at the anvil.',
        action: { to: '/forge', label: 'Back to the forge' },
      };
    case 'AwaitingDestination':
      return {
        line: 'The swords are finished and waiting on your decision.',
        action: { to: '/forge/destination', label: 'Choose where they go' },
      };
    case 'AlreadyAnswered':
      return {
        line: 'The request has been answered. There is nothing more to forge here yet.',
        action: { to: '/forge', label: 'Back to the forge' },
      };
    case 'NoSmithAvailable':
      return {
        line:
          forge.smiths
            .map((smith) => `${smith.name} cannot take the work. ${smith.unavailableReason ?? ''}`)
            .join(' ')
            .trim() || 'There is nobody at the anvil to take the work.',
        action: { to: '/forge', label: 'Back to the forge' },
      };
  }
}

/**
 * Pattern, grade, technique and smith.
 *
 * Radio groups rather than selects: every option and its reason is readable at
 * once, which is what makes an unavailable grade something to work toward rather
 * than a locked row discovered by clicking.
 *
 * **Quantity is not here.** How many swords is the kingdom's business, and a
 * number the player could edit would be a number they could get wrong.
 */
function Selection({
  forge,
  order,
  disabled,
  onChange,
}: {
  readonly forge: ForgeState;
  readonly order: CraftOrder;
  readonly disabled: boolean;
  readonly onChange: (order: CraftOrder) => void;
}) {
  return (
    <section aria-labelledby="selection-heading" className="terms-panel selection">
      <h2 id="selection-heading" className="visually-hidden">
        The project
      </h2>

      <fieldset className="choice" disabled={disabled}>
        <legend className="choice__legend">Pattern</legend>
        {forge.patterns.map((pattern) => (
          <label key={pattern.id} className="choice__option">
            <input
              type="radio"
              name="pattern"
              value={pattern.id}
              checked={order.patternId === pattern.id}
              onChange={() => {
                onChange({ ...order, patternId: pattern.id });
              }}
            />
            <span className="choice__name">{pattern.displayName}</span>
            <span className="choice__detail">{pattern.description}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="choice" disabled={disabled}>
        <legend className="choice__legend">Material grade</legend>
        {forge.grades.map((grade) => (
          <label key={grade.id} className="choice__option" data-unavailable={grade.unavailableReason !== null}>
            <input
              type="radio"
              name="grade"
              value={grade.id}
              checked={order.gradeId === grade.id}
              disabled={grade.unavailableReason !== null}
              onChange={() => {
                onChange({ ...order, gradeId: grade.id });
              }}
            />
            <span className="choice__name">{grade.displayName}</span>
            {grade.unavailableReason !== null && (
              <span className="choice__detail">{grade.unavailableReason}</span>
            )}
          </label>
        ))}
      </fieldset>

      <fieldset className="choice" disabled={disabled}>
        <legend className="choice__legend">Technique</legend>
        {forge.techniques.map((technique) => (
          <label key={technique.id} className="choice__option">
            <input
              type="radio"
              name="technique"
              value={technique.id}
              checked={order.techniqueId === technique.id}
              onChange={() => {
                onChange({ ...order, techniqueId: technique.id });
              }}
            />
            <span className="choice__name">{technique.displayName}</span>
            <span className="choice__detail">{technique.description}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="choice" disabled={disabled}>
        <legend className="choice__legend">Smith</legend>
        {forge.smiths.map((smith) => (
          <label key={smith.id} className="choice__option" data-unavailable={smith.unavailableReason !== null}>
            <input
              type="radio"
              name="smith"
              value={smith.id}
              checked={order.smithId === smith.id}
              disabled={smith.unavailableReason !== null}
              onChange={() => {
                onChange({ ...order, smithId: smith.id });
              }}
            />
            <span className="choice__name">
              {smith.name}, {smith.mastery}
            </span>
            {smith.unavailableReason !== null && (
              <span className="choice__detail">{smith.unavailableReason}</span>
            )}
          </label>
        ))}
      </fieldset>
    </section>
  );
}

/**
 * The terms, recomputed as the selection changes.
 *
 * Cost beside the balance it leaves, the completion time rather than only the
 * duration, the quality **guaranteed** in the plainest word available, what the
 * swords do in the line, and the destination decision named before it arrives so
 * it is an expected step rather than an ambush.
 */
function Terms({ quote }: { readonly quote: CraftQuote }) {
  const spend = new Map(quote.cost.map((entry) => [entry.kind, entry.amount]));

  return (
    <section aria-labelledby="terms-heading" className="terms-panel">
      <h2 id="terms-heading" className="visually-hidden">
        Terms
      </h2>

      <table className="ledger-table">
        <caption className="visually-hidden">
          What the craft costs, and what each balance would be afterwards
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
        <span className="orders__label">Quantity</span>
        <span className="numeric">{quote.quantity}</span> {quote.patternName}s
      </p>

      <p className="orders__duration">
        <span className="orders__label">Duration</span>
        <span className="numeric">{quote.durationMinutes}</span> minutes · complete at{' '}
        <span className="numeric">{clockTime(quote.completesAtUtc)}</span>
      </p>

      {/* "Guaranteed" is stated outright. Ordinary forging has a floor and
          delivers exactly it — there is no roll to describe and no word here
          that suggests one. */}
      <p className="orders__duration">
        <span className="orders__label">Quality</span>
        {quote.qualityFloor} — guaranteed
      </p>

      <p className="orders__duration">
        <span className="orders__label">In the line</span>
        {quote.equipmentEffect}
      </p>

      <p className="orders__duration">
        <span className="orders__label">Destination</span>
        When the swords are finished you will choose one destination for them, and that
        choice is final.
      </p>
    </section>
  );
}

/**
 * The shortfall notice, which **replaces** the confirm rather than sitting
 * beside a disabled one — the same act, at the same price, as a construction
 * shortage.
 */
function Shortfalls({
  quote,
  offline,
  working,
  onProcure,
}: {
  readonly quote: CraftQuote;
  readonly offline: boolean;
  readonly working: boolean;
  readonly onProcure: () => void;
}) {
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

/** "14:35" — the completion time, not only the duration. */
function clockTime(iso: string): string {
  const at = new Date(iso);

  return `${String(at.getUTCHours()).padStart(2, '0')}:${String(at.getUTCMinutes()).padStart(2, '0')}`;
}
