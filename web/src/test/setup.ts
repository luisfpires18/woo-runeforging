import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// jsdom keeps one location for the whole file, so a test that navigates would
// otherwise leave the next one starting on a different screen.
beforeEach(() => {
  window.history.pushState({}, '', '/');
});

// No test touches the network. The app probes /api/v1/platform/status to decide
// whether it is offline; left unstubbed that becomes a real request against
// whatever happens to be listening on the jsdom origin, which is both slow and
// non-deterministic. Rejecting is the honest stand-in: during a test run there
// is no backend, so the app is offline.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('No backend during tests.'))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});
