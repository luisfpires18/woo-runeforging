import { useEffect, useState } from 'react';

import { getPlatformStatus, type PlatformStatus } from './api/client.ts';

type Load =
  | { readonly state: 'loading' }
  | { readonly state: 'loaded'; readonly status: PlatformStatus }
  | { readonly state: 'failed'; readonly message: string };

/**
 * A neutral structural shell. It proves the browser can reach the API and
 * nothing more — the product's visual design is deliberately scheduled for a
 * later prompt, so there is no theme, palette or component library here yet.
 */
export function App() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    getPlatformStatus(controller.signal)
      .then((status) => {
        setLoad({ state: 'loaded', status });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setLoad({
          state: 'failed',
          message: error instanceof Error ? error.message : 'The API could not be reached.',
        });
      });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="shell">
      <header className="shell__header">
        <h1>Weapons of Chaos and Order</h1>
        <p className="shell__subtitle">Platform shell</p>
      </header>

      <main className="shell__main">
        <section aria-labelledby="backend-heading" className="panel">
          <h2 id="backend-heading">Backend</h2>
          <PlatformPanel load={load} />
        </section>
      </main>

      <footer className="shell__footer">
        <p>No gameplay is implemented yet.</p>
      </footer>
    </div>
  );
}

function PlatformPanel({ load }: { readonly load: Load }) {
  switch (load.state) {
    case 'loading':
      return <p role="status">Contacting the API…</p>;

    case 'failed':
      return (
        <div role="alert">
          <p>The API could not be reached.</p>
          <p className="panel__detail">{load.message}</p>
          <p className="panel__detail">
            Start PostgreSQL and the backend, then reload. See README.md.
          </p>
        </div>
      );

    case 'loaded':
      return (
        <dl className="facts">
          <dt>Application</dt>
          <dd>{load.status.application}</dd>

          <dt>Environment</dt>
          <dd>{load.status.environment}</dd>

          <dt>Server time (UTC)</dt>
          <dd>{load.status.utcNow}</dd>

          <dt>Database</dt>
          <dd>{load.status.database.connected ? 'Connected' : 'Not connected'}</dd>
        </dl>
      );
  }
}
