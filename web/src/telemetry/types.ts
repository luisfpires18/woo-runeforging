import type { BuildingKind, ResourceKind } from '../api/types.ts';

/**
 * What the construction loop instruments, and nothing more.
 *
 * The prompt also asks for chosen technique, destination choice and time to
 * first craft. Those shipped **without** instrumentation by the product owner's
 * decision, and are deferred to the playtest package that defines what the
 * numbers are for — not, as an earlier note here said, to "the forging half",
 * which has since shipped.
 *
 * **Events follow causal transitions, not renders.** Each one is emitted from
 * the outcome of a command or from an explicit exit, never from a component
 * happening to draw. `TransitionSink` enforces that with a key, so React's
 * rerenders, StrictMode's double-invoke and repeated loads cannot duplicate one.
 */
export type TelemetryEvent =
  | {
      readonly name: 'construction.first';
      readonly kind: BuildingKind;
      /** From the provider mounting to the first successful begin. */
      readonly elapsedMs: number;
    }
  | { readonly name: 'construction.confirmed'; readonly kind: BuildingKind }
  | {
      readonly name: 'construction.abandoned';
      readonly kind: BuildingKind;
      readonly at: AbandonPoint;
    }
  | {
      readonly name: 'shortage.shown';
      readonly kind: BuildingKind;
      readonly short: readonly ResourceKind[];
      readonly goldPrice: number;
    }
  | {
      readonly name: 'shortage.procured';
      readonly kind: BuildingKind;
      readonly goldPrice: number;
    }
  | { readonly name: 'construction.completed'; readonly kind: BuildingKind };

/** Where the player left the confirm without committing. */
export type AbandonPoint = 'cancelled' | 'navigated-away' | 'shortage-unresolved';

export interface TelemetrySink {
  record(event: TelemetryEvent): void;
}

/** A monotonic millisecond reading. Injected so tests are deterministic. */
export type TimeSource = () => number;

/** The default. Nothing is collected, and nothing leaves the process. */
export const noopSink: TelemetrySink = {
  record: () => {
    // Intentionally empty. There is no analytics service, and Prompt 6 does not
    // add one — the sink exists so the events are typed and testable.
  },
};

/**
 * Records events in order. For tests, and for reading in a console session.
 */
export class InMemorySink implements TelemetrySink {
  readonly events: TelemetryEvent[] = [];

  record(event: TelemetryEvent): void {
    this.events.push(event);
  }

  namesOf(name: TelemetryEvent['name']): TelemetryEvent[] {
    return this.events.filter((event) => event.name === name);
  }
}

/**
 * A sink that drops a repeat of a transition it has already reported.
 *
 * The guard is a key rather than a timestamp because the duplicates worth
 * stopping are not near-simultaneous: a completion is observed on every
 * subsequent `load`, and a shortage is present on every render while it lasts.
 * Keys make "the same transition" mean the same thing in both cases.
 */
export class TransitionSink implements TelemetrySink {
  private readonly seen = new Set<string>();
  private readonly inner: TelemetrySink;

  constructor(inner: TelemetrySink) {
    this.inner = inner;
  }

  record(event: TelemetryEvent): void {
    this.inner.record(event);
  }

  /** Records only if this key has not been recorded before. */
  once(key: string, event: TelemetryEvent): void {
    if (this.seen.has(key)) {
      return;
    }

    this.seen.add(key);
    this.inner.record(event);
  }
}
