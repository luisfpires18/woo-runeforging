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
import type { BuildingKind, SettlementState, SettlementStateSource } from './types.ts';

export type LoadPhase =
  | { readonly phase: 'loading' }
  | { readonly phase: 'loaded'; readonly state: SettlementState }
  | { readonly phase: 'error'; readonly message: string };

/**
 * What a command is doing right now.
 *
 * `working` is what disables the control. A duplicate call is never silently
 * dropped — it reaches the source, which refuses it, and the refusal lands here
 * as `failed` where the screen can say so.
 */
export type CommitPhase =
  | { readonly phase: 'idle' }
  | { readonly phase: 'working'; readonly kind: BuildingKind }
  | { readonly phase: 'failed'; readonly kind: BuildingKind; readonly message: string };

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
      kind: BuildingKind,
      command: () => Promise<SettlementState>,
      onSuccess?: () => void,
    ): Promise<boolean> => {
      setCommit({ phase: 'working', kind });

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
          kind,
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
        kind,
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
        kind,
        () => source.procureConstructionShortfalls(kind),
        () => {
          telemetry.record({ name: 'shortage.procured', kind, goldPrice: goldSpent.current });
        },
      ),
    [run, source, telemetry],
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
      dismissCommitFailure,
      advanceTime,
    }),
    [
      load,
      reload,
      commit,
      beginConstruction,
      procureShortfalls,
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
