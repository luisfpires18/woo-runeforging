import { render } from '@testing-library/react';

import { HouseStateProvider } from '../api/HouseStateProvider.tsx';
import type { HouseState, HouseStateSource } from '../api/types.ts';
import { FakeHouseStateSource, type Scenario } from '../api/fake/fakeHouseStateSource.ts';
import { App } from '../app/App.tsx';
import { Router } from '../app/router.tsx';

/**
 * Test harness. Only tests and `main.tsx` may reach for a fake source —
 * features and shared components are held to the boundary by ESLint.
 */
export function renderApp(source: HouseStateSource) {
  return render(
    <HouseStateProvider source={source}>
      <Router>
        <App />
      </Router>
    </HouseStateProvider>,
  );
}

export function renderScenario(scenario: Scenario = 'firstSession', latencyMs = 0) {
  const source = new FakeHouseStateSource(scenario, latencyMs);
  return { source, ...renderApp(source) };
}

/** A source that always fails, for the error state. */
export class FailingSource implements HouseStateSource {
  load(): Promise<HouseState> {
    return Promise.reject(new Error('The ridge road is closed.'));
  }
}

/** A source that never settles, for the loading state. */
export class NeverResolvingSource implements HouseStateSource {
  load(): Promise<HouseState> {
    return new Promise<HouseState>(() => {
      // deliberately never settles
    });
  }
}
