import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { SettlementState, SettlementStateSource } from './types.ts';

export type LoadPhase =
  | { readonly phase: 'loading' }
  | { readonly phase: 'loaded'; readonly state: SettlementState }
  | { readonly phase: 'error'; readonly message: string };

interface SettlementStateContextValue {
  readonly load: LoadPhase;
  /** Refetch. The only supported way to observe changed state. */
  readonly reload: () => void;
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
  const [generation, setGeneration] = useState(0);

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

  const reload = useCallback(() => {
    setLoad({ phase: 'loading' });
    setGeneration((n) => n + 1);
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
    () => ({ load, reload, advanceTime }),
    [load, reload, advanceTime],
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
