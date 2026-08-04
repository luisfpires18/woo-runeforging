import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useTelemetry } from '../telemetry/TelemetryProvider.tsx';
import type {
  BuildingKind,
  CraftOrder,
  Destination,
  SettlementState,
  SettlementStateSource,
} from './types.ts';

export type LoadPhase =
  | { readonly phase: 'loading' }
  | { readonly phase: 'loaded'; readonly state: SettlementState }
  | { readonly phase: 'error'; readonly message: string };

/**
 * Which command is in flight, so a screen can tell whether the working or failed
 * phase is about the thing it is showing.
 *
 * A discriminated subject rather than a building: construction is no longer the
 * only thing that commits, and a craft rejection must not disable a
 * construction button somewhere else on the page.
 */
export type CommitSubject =
  | { readonly of: 'construction'; readonly kind: BuildingKind }
  | { readonly of: 'craft' }
  | { readonly of: 'destination'; readonly destination: Destination };

/**
 * What a command is doing right now.
 *
 * `working` is what disables the control. A duplicate call is never silently
 * dropped — it reaches the source, which refuses it, and the refusal lands here
 * as `failed` where the screen can say so.
 */
export type CommitPhase =
  | { readonly phase: 'idle' }
  | { readonly phase: 'working'; readonly subject: CommitSubject }
  | {
      readonly phase: 'failed';
      readonly subject: CommitSubject;
      readonly message: string;
    };

/** Whether a commit phase is about construction of this building. */
export function isConstructionOf(subject: CommitSubject, kind: BuildingKind): boolean {
  return subject.of === 'construction' && subject.kind === kind;
}

interface SettlementStateContextValue {
  readonly load: LoadPhase;
  /** Refetch. The only supported way to observe changed state. */
  readonly reload: () => void;
  readonly commit: CommitPhase;
  /**
   * Spends the cost and starts the work, or rejects and changes nothing.
   * Resolves `true` when the settlement accepted it.
   */
  readonly beginConstruction: (kind: BuildingKind) => Promise<boolean>;
  /** Buys every current shortfall for one site, all or nothing. */
  readonly procureShortfalls: (kind: BuildingKind) => Promise<boolean>;
  /**
   * Spends the cost, assigns the smith and starts the craft, or rejects and
   * changes nothing. The quantity is the kingdom's, not the caller's.
   */
  readonly beginCraft: (order: CraftOrder) => Promise<boolean>;
  /** Buys every current shortfall for one craft, all or nothing. */
  readonly procureCraftShortfalls: (order: CraftOrder) => Promise<boolean>;
  /** Sends the finished batch to exactly one destination, irreversibly. */
  readonly chooseCraftDestination: (
    craftId: string,
    destination: Destination,
  ) => Promise<boolean>;
  /** Clears a rejection once the player has seen it. */
  readonly dismissCommitFailure: () => void;
  /**
   * Development-only. Advances the source's clock and reloads through the same
   * path a refetch takes, so components observe a new `SettlementState` and
   * never learn that a clock exists. `null` when the source cannot travel in
   * time — which is what a real HTTP source will be.
   */
  readonly advanceTime: ((minutes: number) => void) | null;
}

const SettlementStateContext = createContext<SettlementStateContextValue | null>(null);

/** A source that can move its own clock. Only the fake one can. */
interface TimeTravelling {
  advance(minutes: number): void;
}

function canTimeTravel(
  source: SettlementStateSource,
): source is SettlementStateSource & TimeTravelling {
  return 'advance' in source && typeof (source as TimeTravelling).advance === 'function';
}

export function SettlementStateProvider({
  source,
  children,
}: {
  readonly source: SettlementStateSource;
  readonly children: ReactNode;
}) {
  const [load, setLoad] = useState<LoadPhase>({ phase: 'loading' });
  const [commit, setCommit] = useState<CommitPhase>({ phase: 'idle' });
  const [generation, setGeneration] = useState(0);

  const telemetry = useTelemetry();
  const begunOnce = useRef(false);

  // Read from the state before and after, so the reported price is what the
  // settlement actually paid rather than what a screen predicted.
  const goldSpent = useRef(0);
  const goldBefore =
    load.phase === 'loaded'
      ? (load.state.resources.find((balance) => balance.kind === 'Gold')?.amount ?? 0)
      : 0;

  // The effect only records the outcome. Moving to the loading phase happens in
  // `reload`, which is an event handler — setting it here as well would be a
  // synchronous setState inside an effect, and a cascading render.
  useEffect(() => {
    const controller = new AbortController();

    source
      .load(controller.signal)
      .then((state) => {
        if (!controller.signal.aborted) {
          setLoad({ phase: 'loaded', state });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setLoad({
          phase: 'error',
          message:
            error instanceof Error ? error.message : 'The settlement could not be reached.',
        });
      });

    return () => {
      controller.abort();
    };
  }, [source, generation]);

  // A completion is observed on every load after it happens, so the event is
  // keyed on the building and the moment it finished rather than on the read.
  useEffect(() => {
    if (load.phase !== 'loaded') {
      return;
    }

    for (const building of load.state.buildings) {
      if (building.status === 'Complete' && building.completesAtUtc !== null) {
        telemetry.recordOnce(`completed:${building.kind}:${building.completesAtUtc}`, {
          name: 'construction.completed',
          kind: building.kind,
        });
      }
    }
  }, [load, telemetry]);

  const reload = useCallback(() => {
    setLoad({ phase: 'loading' });
    setGeneration((n) => n + 1);
  }, []);

  /**
   * Runs one command. The state a command returns replaces what is held — no
   * optimistic update, no client-side mutation (ADR-0017).
   */
  const run = useCallback(
    async (
      subject: CommitSubject,
      command: () => Promise<SettlementState>,
      onSuccess?: () => void,
    ): Promise<boolean> => {
      setCommit({ phase: 'working', subject });

      try {
        const next = await command();

        goldSpent.current =
          goldBefore - (next.resources.find((balance) => balance.kind === 'Gold')?.amount ?? 0);

        setLoad({ phase: 'loaded', state: next });
        setCommit({ phase: 'idle' });
        onSuccess?.();

        return true;
      } catch (error: unknown) {
        setCommit({
          phase: 'failed',
          subject,
          message:
            error instanceof Error ? error.message : 'The settlement refused that.',
        });

        return false;
      }
    },
    [goldBefore],
  );

  const beginConstruction = useCallback(
    (kind: BuildingKind) =>
      run(
        { of: 'construction', kind },
        () => source.beginConstruction(kind),
        () => {
          telemetry.record({ name: 'construction.confirmed', kind });

          if (!begunOnce.current) {
            begunOnce.current = true;
            telemetry.record({
              name: 'construction.first',
              kind,
              elapsedMs: telemetry.sinceStart(),
            });
          }
        },
      ),
    [run, source, telemetry],
  );

  const procureShortfalls = useCallback(
    (kind: BuildingKind) =>
      run(
        { of: 'construction', kind },
        () => source.procureConstructionShortfalls(kind),
        () => {
          telemetry.record({ name: 'shortage.procured', kind, goldPrice: goldSpent.current });
        },
      ),
    [run, source, telemetry],
  );

  // The forge commands carry no telemetry. Forging events — chosen technique,
  // destination choice, time to first craft — are deferred to the playtest
  // package that defines what the numbers are for.
  const beginCraft = useCallback(
    (order: CraftOrder) => run({ of: 'craft' }, () => source.beginCraft(order)),
    [run, source],
  );

  const procureCraftShortfalls = useCallback(
    (order: CraftOrder) =>
      run({ of: 'craft' }, () => source.procureCraftShortfalls(order)),
    [run, source],
  );

  const chooseCraftDestination = useCallback(
    (craftId: string, destination: Destination) =>
      run({ of: 'destination', destination }, () =>
        source.chooseCraftDestination(craftId, destination),
      ),
    [run, source],
  );

  const dismissCommitFailure = useCallback(() => {
    setCommit({ phase: 'idle' });
  }, []);

  const advanceTime = useMemo(() => {
    if (!import.meta.env.DEV || !canTimeTravel(source)) {
      return null;
    }

    // Advancing time goes through the same reload path a refetch will take, so
    // components observe a new state and never learn a clock exists.
    return (minutes: number) => {
      source.advance(minutes);
      setLoad({ phase: 'loading' });
      setGeneration((n) => n + 1);
    };
  }, [source]);

  const value = useMemo<SettlementStateContextValue>(
    () => ({
      load,
      reload,
      commit,
      beginConstruction,
      procureShortfalls,
      beginCraft,
      procureCraftShortfalls,
      chooseCraftDestination,
      dismissCommitFailure,
      advanceTime,
    }),
    [
      load,
      reload,
      commit,
      beginConstruction,
      procureShortfalls,
      beginCraft,
      procureCraftShortfalls,
      chooseCraftDestination,
      dismissCommitFailure,
      advanceTime,
    ],
  );

  return <SettlementStateContext value={value}>{children}</SettlementStateContext>;
}

export function useSettlementState(): SettlementStateContextValue {
  const value = useContext(SettlementStateContext);

  if (value === null) {
    throw new Error('useSettlementState must be used inside a SettlementStateProvider.');
  }

  return value;
}
