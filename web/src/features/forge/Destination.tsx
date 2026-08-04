import { useEffect, useRef, useState } from 'react';

import {
  destinationBlockOf,
  destinationConsequence,
  destinationLabel,
  destinations,
  settledSummary,
  type DestinationBlock,
} from '../../api/forging.ts';
import { useSettlementState } from '../../api/SettlementStateProvider.tsx';
import type {
  Destination as DestinationChoice,
  ForgeState,
  SettlementState,
} from '../../api/types.ts';
import { Link, useRouter } from '../../app/router.tsx';

/**
 * Where the batch goes — one place, for good.
 *
 * The exclusivity is the point, and it is stated twice: once as the rule, and
 * once as the consequence of the option under the cursor. Choosing is two steps
 * on one screen — select, then confirm — rather than a confirmation dialog on
 * top of a list, because a sheet that opens a sheet fails the mobile rule.
 *
 * Every lifecycle state is reachable at this address. When there is no decision
 * to make, the screen says which kind of nothing it is and renders **no
 * options**, so none can be chosen early or changed late.
 */
export function Destination({
  state,
  offline,
}: {
  readonly state: SettlementState;
  readonly offline: boolean;
}) {
  const { forge } = state;
  const { navigate } = useRouter();
  const { commit, chooseCraftDestination, dismissCommitFailure } = useSettlementState();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const [chosen, setChosen] = useState<DestinationChoice | null>(null);

  const block = destinationBlockOf(forge);
  // Held in a local so the confirm's callback keeps the narrowing: the id is
  // sent with the command precisely so a stale screen cannot settle a batch it
  // is not the one looking at.
  const craft = forge.craft;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

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

  const working = commit.phase === 'working' && commit.subject.of === 'destination';
  const failed =
    commit.phase === 'failed' && commit.subject.of === 'destination' ? commit.message : null;

  return (
    <div className="forge">
      <Breadcrumb />

      <header className="intro">
        <p className="intro__eyebrow">Destination</p>
        <h1 className="intro__title" ref={headingRef} tabIndex={-1}>
          {block === null ? 'Where do the swords go?' : 'No decision to make'}
        </h1>
        {block === null && (
          <p className="intro__prose">
            One batch, one destination. Whatever you choose, the swords cannot also go
            anywhere else, and the choice cannot be taken back.
          </p>
        )}
      </header>

      <div className="theatre">
        {block !== null ? (
          <Blocked block={block} forge={forge} />
        ) : (
          <>
            <section aria-labelledby="options-heading" className="terms-panel">
              <h2 id="options-heading" className="orders__terms-heading">
                The four destinations
              </h2>

              <fieldset className="choice">
                <legend className="visually-hidden">Choose one destination</legend>
                {destinations.map((destination) => (
                  <label key={destination} className="choice__option">
                    <input
                      type="radio"
                      name="destination"
                      value={destination}
                      checked={chosen === destination}
                      onChange={() => {
                        setChosen(destination);
                      }}
                    />
                    <span className="choice__name">{destinationLabel(destination)}</span>
                    <span className="choice__detail">
                      {destinationConsequence(destination, forge.request.feeGold)}
                    </span>
                  </label>
                ))}
              </fieldset>
            </section>

            <section
              aria-labelledby="commit-heading"
              className={`orders orders--commit${chosen === null ? '' : ' orders--task'}`}
            >
              <div className="orders__head">
                <h2 id="commit-heading" className="orders__heading">
                  Confirm
                </h2>
              </div>

              <div className="orders__body">
                {chosen === null ? (
                  <p className="orders__state">
                    Choose one of the four. Nothing is decided until you confirm.
                  </p>
                ) : (
                  <p className="orders__warning">
                    {destinationLabel(chosen)}. This cannot be undone, and the swords
                    cannot go anywhere else afterwards.
                  </p>
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
                {chosen !== null && craft !== null && (
                  <button
                    type="button"
                    className="button button--primary"
                    disabled={working || offline}
                    onClick={() => {
                      void chooseCraftDestination(craft.id, chosen).then((accepted) => {
                        if (accepted) {
                          navigate('/forge');
                        }
                      });
                    }}
                  >
                    {working ? 'Sending…' : `Confirm — ${destinationLabel(chosen)}`}
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
          </>
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
      <span aria-current="page">Destination</span>
    </nav>
  );
}

/**
 * What is true when there is no destination to choose.
 *
 * A settled craft becomes a **record** of the decision — what was chosen, when,
 * and the Gold it moved or quoted — and offers no way to revisit it.
 */
function Blocked({
  block,
  forge,
}: {
  readonly block: DestinationBlock;
  readonly forge: ForgeState;
}) {
  const { craft } = forge;

  return (
    <section aria-labelledby="blocked-heading" className="orders orders--commit">
      <div className="orders__head">
        <h2 id="blocked-heading" className="orders__heading">
          {block === 'AlreadyChosen' ? 'Already decided' : 'Nothing to decide'}
        </h2>
      </div>

      <div className="orders__body">
        {block === 'NoCraft' && (
          <p className="orders__state">
            Nothing has been forged yet, so there is nothing to send anywhere.
          </p>
        )}

        {block === 'NotFinished' && craft !== null && (
          <p className="orders__state">
            The swords are not finished yet — they are due at{' '}
            <span className="numeric">{clockTime(craft.completesAtUtc)}</span>.
          </p>
        )}

        {block === 'AlreadyChosen' && craft !== null && (
          <>
            <p className="orders__state">{settledSummary(craft)}</p>
            <p className="orders__prose">
              A batch goes to one place only, and this one has gone. It cannot be
              redirected.
            </p>
          </>
        )}
      </div>

      <div className="task__actions">
        <Link
          to={forge.available ? '/forge' : '/settlement/forge'}
          className="button button--secondary"
        >
          {forge.available ? 'Back to the forge' : 'Raise the Forge'}
        </Link>
      </div>
    </section>
  );
}

function clockTime(iso: string): string {
  const at = new Date(iso);

  return `${String(at.getUTCHours()).padStart(2, '0')}:${String(at.getUTCMinutes()).padStart(2, '0')}`;
}
