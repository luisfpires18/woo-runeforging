import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';

import { TransitionSink, noopSink, type TelemetryEvent, type TelemetrySink, type TimeSource } from './types.ts';

interface TelemetryContextValue {
  /** Records an event every time it is called. */
  readonly record: (event: TelemetryEvent) => void;
  /** Records an event only the first time this key is seen. */
  readonly recordOnce: (key: string, event: TelemetryEvent) => void;
  /** Milliseconds since the provider mounted, from the injected time source. */
  readonly sinceStart: () => number;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

/**
 * Supplies the sink, so no feature imports a concrete one.
 *
 * The default is a no-op: Prompt 6 instruments the construction loop without
 * adding an analytics service, and nothing leaves the process. Tests pass an
 * `InMemorySink` and a fake `now` instead.
 */
export function TelemetryProvider({
  sink = noopSink,
  now = () => performance.now(),
  children,
}: {
  readonly sink?: TelemetrySink;
  readonly now?: TimeSource;
  readonly children: ReactNode;
}) {
  // Refs, not state: the guard and the start reading must survive a rerender
  // and StrictMode's mount–unmount–remount without being reset by either.
  // Initialised eagerly so neither is ever null after the first render.
  const transitions = useRef<TransitionSink>(new TransitionSink(sink));
  const startedAt = useRef<number>(now());

  const value = useMemo<TelemetryContextValue>(() => {
    const guard = transitions.current;
    const start = startedAt.current;

    return {
      record: (event) => {
        guard.record(event);
      },
      recordOnce: (key, event) => {
        guard.once(key, event);
      },
      sinceStart: () => now() - start,
    };
  }, [now]);

  return <TelemetryContext value={value}>{children}</TelemetryContext>;
}

export function useTelemetry(): TelemetryContextValue {
  const value = useContext(TelemetryContext);

  if (value === null) {
    throw new Error('useTelemetry must be used inside a TelemetryProvider.');
  }

  return value;
}
