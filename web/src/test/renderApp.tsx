import { render } from '@testing-library/react';

import { SettlementStateProvider } from '../api/SettlementStateProvider.tsx';
import type { SettlementState, SettlementStateSource } from '../api/types.ts';
import { FakeSettlementStateSource, type Scenario } from '../api/fake/fakeSettlementStateSource.ts';
import { App } from '../app/App.tsx';
import { Router } from '../app/router.tsx';

/**
 * Test harness. Only tests and `main.tsx` may reach for a fake source —
 * features and shared components are held to the boundary by ESLint.
 */
export function renderApp(source: SettlementStateSource) {
  return render(
    <SettlementStateProvider source={source}>
      <Router>
        <App />
      </Router>
    </SettlementStateProvider>,
  );
}

export function renderScenario(scenario: Scenario = 'firstSession', latencyMs = 0) {
  const source = new FakeSettlementStateSource(scenario, latencyMs);
  return { source, ...renderApp(source) };
}

/** A source that always fails, for the error state. */
export class FailingSource implements SettlementStateSource {
  load(): Promise<SettlementState> {
    return Promise.reject(new Error('The ridge road is closed.'));
  }
}

/** A source that never settles, for the loading state. */
export class NeverResolvingSource implements SettlementStateSource {
  load(): Promise<SettlementState> {
    return new Promise<SettlementState>(() => {
      // deliberately never settles
    });
  }
}
