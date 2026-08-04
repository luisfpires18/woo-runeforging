import { render } from '@testing-library/react';

import { SettlementStateProvider } from '../api/SettlementStateProvider.tsx';
import type { BuildingKind, SettlementState, SettlementStateSource } from '../api/types.ts';
import { CommandRejection } from '../api/types.ts';
import { FakeSettlementStateSource, type Scenario } from '../api/fake/fakeSettlementStateSource.ts';
import { App } from '../app/App.tsx';
import { Router } from '../app/router.tsx';
import { TelemetryProvider } from '../telemetry/TelemetryProvider.tsx';
import { InMemorySink } from '../telemetry/types.ts';

/**
 * Test harness. Only tests and `main.tsx` may reach for a fake source —
 * features and shared components are held to the boundary by ESLint.
 *
 * Telemetry gets an in-memory sink and a **fake time source**, so an elapsed
 * measurement is a number the test chose rather than one the machine happened
 * to produce.
 */
export function renderApp(source: SettlementStateSource) {
  const sink = new InMemorySink();
  let clock = 0;
  const now = () => (clock += 1000);

  return {
    sink,
    ...render(
      <TelemetryProvider sink={sink} now={now}>
        <SettlementStateProvider source={source}>
          <Router>
            <App />
          </Router>
        </SettlementStateProvider>
      </TelemetryProvider>,
    ),
  };
}

export function renderScenario(scenario: Scenario = 'firstSession', latencyMs = 0) {
  const source = new FakeSettlementStateSource(scenario, latencyMs);
  return { source, ...renderApp(source) };
}

/**
 * Commands a test may run against the settlement **before** it is rendered.
 *
 * Every one of them is a real command, so a primed position is one the
 * settlement could actually have reached — priming is a shortcut through the
 * interface, never around the rules. Feature tests take this rather than the
 * fake source itself, so they never name a fixture type.
 */
export interface Primer {
  begin(kind: BuildingKind): Promise<void>;
  procure(kind: BuildingKind): Promise<void>;
  advance(minutes: number): void;
}

/**
 * Builds a render for a settlement that has already done something.
 *
 * Returns a function so one primed position can be declared once and used by
 * several tests, each getting its own source.
 */
export function renderPrimed(
  prime: (settlement: Primer) => Promise<void>,
  scenario: Scenario = 'firstSession',
) {
  return async () => {
    const source = new FakeSettlementStateSource(scenario);

    await prime({
      begin: async (kind) => {
        await source.beginConstruction(kind);
      },
      procure: async (kind) => {
        await source.procureConstructionShortfalls(kind);
      },
      advance: (minutes) => {
        source.advance(minutes);
      },
    });

    return { source, ...renderApp(source) };
  };
}

/** A source that always fails, for the error state. */
export class FailingSource implements SettlementStateSource {
  load(): Promise<SettlementState> {
    return Promise.reject(new Error('The ridge road is closed.'));
  }

  beginConstruction(): Promise<SettlementState> {
    return Promise.reject(new CommandRejection('The ridge road is closed.'));
  }

  procureConstructionShortfalls(): Promise<SettlementState> {
    return Promise.reject(new CommandRejection('The ridge road is closed.'));
  }
}

/** A source that never settles, for the loading state. */
export class NeverResolvingSource implements SettlementStateSource {
  load(): Promise<SettlementState> {
    return new Promise<SettlementState>(() => {
      // deliberately never settles
    });
  }

  beginConstruction(): Promise<SettlementState> {
    return new Promise<SettlementState>(() => {
      // deliberately never settles
    });
  }

  procureConstructionShortfalls(): Promise<SettlementState> {
    return new Promise<SettlementState>(() => {
      // deliberately never settles
    });
  }
}
