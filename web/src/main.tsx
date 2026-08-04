import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { SettlementStateProvider } from './api/SettlementStateProvider.tsx';
import type { Scenario } from './api/fake/fakeSettlementStateSource.ts';
import { FakeSettlementStateSource } from './api/fake/fakeSettlementStateSource.ts';
import { App } from './app/App.tsx';
import { Router } from './app/router.tsx';
import './styles/global.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('The #root element is missing from index.html.');
}

/**
 * The only place a fake source is chosen.
 *
 * `?scenario=returning` opens the construction demo: the Lumber Yard is already
 * under way and the development time control can carry it to completion.
 * `?scenario=empty` opens a settlement with nobody in it, so the empty state can be
 * looked at rather than only asserted. Swapping to real endpoints later means
 * constructing a different `SettlementStateSource` here and changing nothing else.
 */
const scenarios: Readonly<Record<string, Scenario>> = {
  returning: 'returningConstruction',
  empty: 'empty',
};

const requested = new URLSearchParams(window.location.search).get('scenario') ?? '';
const scenario: Scenario = scenarios[requested] ?? 'firstSession';

createRoot(container).render(
  <StrictMode>
    <SettlementStateProvider source={new FakeSettlementStateSource(scenario)}>
      <Router>
        <App />
      </Router>
    </SettlementStateProvider>
  </StrictMode>,
);
