import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { HouseStateProvider } from './api/HouseStateProvider.tsx';
import { FakeHouseStateSource } from './api/fake/fakeHouseStateSource.ts';
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
 * Swapping to real endpoints later means constructing a different
 * `HouseStateSource` here and changing nothing else.
 */
const scenario =
  new URLSearchParams(window.location.search).get('scenario') === 'returning'
    ? 'returningConstruction'
    : 'firstSession';

createRoot(container).render(
  <StrictMode>
    <HouseStateProvider source={new FakeHouseStateSource(scenario)}>
      <Router>
        <App />
      </Router>
    </HouseStateProvider>
  </StrictMode>,
);
