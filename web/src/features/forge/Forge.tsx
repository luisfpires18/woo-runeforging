import { craftBlockOf, settledSummary } from '../../api/forging.ts';
import type { EquipmentBatch, ForgeCraft, ForgeState, SettlementState } from '../../api/types.ts';
import { Link } from '../../app/router.tsx';

/**
 * The Forge — `WIREFRAMES.md` §6.
 *
 * The smith on duty, the request that gives the work its reason, and whatever
 * the forge is holding: nothing yet, work under way, a finished batch waiting on
 * a decision, or the record of where it went.
 *
 * Nothing commits here. The craft is confirmed at `/forge/new` and the
 * destination at `/forge/destination`, each its own address, because each spends
 * or settles something that cannot be taken back.
 */
export function Forge({ state }: { readonly state: SettlementState }) {
  const { forge } = state;

  return (
    <div className="forge">
      <header className="intro">
        <p className="intro__eyebrow">The forge</p>
        <h1 className="intro__title">Anvil and fire</h1>
        <p className="intro__prose">
          {forge.available
            ? 'The fire is in and the anvil is dressed. What leaves this room arms somebody.'
            : 'The ground is surveyed, and nothing stands on it yet.'}
        </p>
      </header>

      <div className="theatre">
        {forge.available ? <SmithOnDuty forge={forge} /> : null}

        <Request forge={forge} />

        {forge.available ? (
          <Project forge={forge} asOfUtc={state.asOfUtc} />
        ) : (
          <NoForge reason={forge.unavailableReason} />
        )}
      </div>
    </div>
  );
}

function SmithOnDuty({ forge }: { readonly forge: ForgeState }) {
  return (
    <section aria-labelledby="smith-heading" className="terms-panel">
      <h2 id="smith-heading" className="orders__terms-heading">
        Smith on duty
      </h2>
      {forge.smiths.map((smith) => (
        <p key={smith.id} className="orders__state">
          <strong>{smith.name}</strong>, {smith.mastery}
          {smith.unavailableReason !== null && <> — {smith.unavailableReason}</>}
        </p>
      ))}
    </section>
  );
}

/**
 * Why the swords are needed, before what they cost.
 *
 * The expectation is stated in words and nothing counts down: nothing in this
 * game expires while the player is away, and the copy must not imply otherwise.
 */
function Request({ forge }: { readonly forge: ForgeState }) {
  const { request } = forge;

  return (
    <section aria-labelledby="request-heading" className="terms-panel request">
      <h2 id="request-heading" className="orders__terms-heading">
        Kingdom request
      </h2>
      <p className="request__summary">{request.summary}</p>
      <p className="orders__prose">{request.detail}</p>
      <p className="orders__terms-line">
        Pays <span className="numeric">{request.feeGold}</span> Gold · {request.expectation}
      </p>
    </section>
  );
}

function NoForge({ reason }: { readonly reason: string | null }) {
  return (
    <section aria-labelledby="no-forge-heading" className="orders orders--commit">
      <div className="orders__head">
        <h2 id="no-forge-heading" className="orders__heading">
          Nothing can be forged yet
        </h2>
      </div>
      <div className="orders__body">
        <p className="orders__state">
          {reason ?? 'The settlement has no forge yet'} — raise it and the smith can begin.
        </p>
      </div>
      <div className="task__actions">
        <Link to="/settlement/forge" className="button button--secondary">
          Raise the Forge
        </Link>
      </div>
    </section>
  );
}

/** Whatever the forge is holding right now, and the one thing to do about it. */
function Project({
  forge,
  asOfUtc,
}: {
  readonly forge: ForgeState;
  readonly asOfUtc: string;
}) {
  const { craft } = forge;

  if (craft === null) {
    const block = craftBlockOf(forge);

    return (
      <section
        aria-labelledby="project-heading"
        className={`orders orders--commit${block === null ? ' orders--task' : ''}`}
      >
        <div className="orders__head">
          <h2 id="project-heading" className="orders__heading">
            No project
          </h2>
        </div>
        <div className="orders__body">
          <p className="orders__state">
            {block === 'NoSmithAvailable'
              ? 'There is nobody at the anvil to take the work.'
              : 'The anvil is clear. Choose a pattern to begin.'}
          </p>
          {block === 'NoSmithAvailable' &&
            forge.smiths.map((smith) => (
              <p key={smith.id} className="orders__state">
                {smith.name}: {smith.unavailableReason}
              </p>
            ))}
        </div>
        {block === null && (
          <div className="task__actions">
            <Link to="/forge/new" className="button button--primary">
              Begin a project
            </Link>
          </div>
        )}
      </section>
    );
  }

  if (craft.status === 'InProgress') {
    const remaining = Math.max(
      0,
      Math.ceil(
        (new Date(craft.completesAtUtc).getTime() - new Date(asOfUtc).getTime()) / 60_000,
      ),
    );

    const technique = forge.techniques.find(
      (candidate) => candidate.id === craft.order.techniqueId,
    );

    return (
      <section aria-labelledby="project-heading" className="orders orders--commit">
        <div className="orders__head">
          <h2 id="project-heading" className="orders__heading">
            Under way
          </h2>
          <p className="orders__title">
            <span className="numeric">{forge.request.quantity}</span> infantry swords
            {technique !== undefined && <> · {technique.displayName}</>}
          </p>
        </div>
        <div className="orders__body">
          <p className="orders__state">
            {remaining === 0
              ? 'The last of the work is being finished.'
              : `The swords are being forged — ${String(remaining)} minutes remain.`}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="project-heading" className="orders orders--commit">
      <div className="orders__head">
        <h2 id="project-heading" className="orders__heading">
          {craft.status === 'Settled' ? 'Answered' : 'Finished'}
        </h2>
      </div>

      <div className="orders__body">
        <Batch batch={craft.batch} />
        <p className="orders__state">
          {craft.status === 'Settled'
            ? settledSummary(craft)
            : 'They can go to one place only, and the choice is final.'}
        </p>
        {craft.status === 'Settled' && (
          <p className="orders__prose">
            The request has been answered. There is nothing more to forge here yet.
          </p>
        )}
        <Provenance craft={craft} forge={forge} />
      </div>

      {craft.status === 'AwaitingDestination' && (
        <div className="task__actions">
          <Link to="/forge/destination" className="button button--primary">
            Choose where they go
          </Link>
        </div>
      )}
    </section>
  );
}

/**
 * The batch, in one line.
 *
 * Condition is said in a word rather than as a percentage. The number is kept
 * on the batch for the systems that will wear it down, but no figure with a `%`
 * appears anywhere in the forge — the screen that has to make "guaranteed" mean
 * something is not the place to start printing rates.
 */
function Batch({ batch }: { readonly batch: EquipmentBatch }) {
  return (
    <p className="orders__title">
      <span className="numeric">{batch.quantity}</span> {batch.patternName}s ·{' '}
      {batch.quality} · {batch.conditionPercent === 100 ? 'unmarked' : 'worn'}
    </p>
  );
}

/**
 * Who made it, from what, under which catalogue.
 *
 * Kept with the batch rather than hidden behind a link: it is the thing that
 * follows the swords into everything they are later used for.
 *
 * **Names, not identifiers.** The batch stores `technique.standard` because that
 * is what later systems reconstruct a craft from; the player is shown "Standard
 * pattern". An identifier on screen is codebase jargon, which the copy rules
 * forbid — `COMPONENTS-AND-STATES.md` §5. The versions stay as they are: they
 * are a record, and a record is meant to look like one.
 */
function Provenance({
  craft,
  forge,
}: {
  readonly craft: ForgeCraft;
  readonly forge: ForgeState;
}) {
  if (craft.batch === null) {
    return null;
  }

  const { maker, equipmentEffect } = craft.batch;

  const patternName =
    forge.patterns.find((candidate) => candidate.id === maker.patternId)?.displayName ??
    craft.batch.patternName;
  const gradeName =
    forge.grades.find((candidate) => candidate.id === maker.gradeId)?.displayName ?? '—';
  const techniqueName =
    forge.techniques.find((candidate) => candidate.id === maker.techniqueId)?.displayName ??
    '—';

  return (
    <div className="provenance">
      <h3 className="orders__terms-heading">Maker</h3>
      <dl className="provenance__list">
        <div className="provenance__row">
          <dt>Smith</dt>
          <dd>
            {maker.smithName}, {maker.smithMastery}
          </dd>
        </div>
        <div className="provenance__row">
          <dt>Forged at</dt>
          <dd>{maker.settlementName}</dd>
        </div>
        <div className="provenance__row">
          <dt>Pattern</dt>
          <dd>{patternName}</dd>
        </div>
        <div className="provenance__row">
          <dt>Grade</dt>
          <dd>{gradeName}</dd>
        </div>
        <div className="provenance__row">
          <dt>Technique</dt>
          <dd>{techniqueName}</dd>
        </div>
        <div className="provenance__row">
          <dt>In the line</dt>
          <dd>{equipmentEffect}</dd>
        </div>
        <div className="provenance__row">
          <dt>Recorded under</dt>
          <dd>
            content {maker.contentVersion} · rules {maker.rulesVersion}
          </dd>
        </div>
      </dl>
    </div>
  );
}
