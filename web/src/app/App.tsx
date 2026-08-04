import { useEffect, useState } from 'react';

import { getPlatformStatus } from '../api/client.ts';
import { kindFromSlug } from '../api/construction.ts';
import { useSettlementState } from '../api/SettlementStateProvider.tsx';
import { ErrorRegion, LoadingRegion } from '../components/StateRegion.tsx';
import { Construction } from '../features/construction/Construction.tsx';
import { CraftProject } from '../features/forge/CraftProject.tsx';
import { Destination } from '../features/forge/Destination.tsx';
import { Forge } from '../features/forge/Forge.tsx';
import { NotFound } from '../features/forge/NotFound.tsx';
import { Outpost } from '../features/outpost/Outpost.tsx';
import { Settlement } from '../features/settlement/Settlement.tsx';
import { AppShell } from './AppShell.tsx';
import { useRouter } from './router.tsx';

export function App() {
  const { load, reload } = useSettlementState();
  const offline = useConnectivity();

  const state = load.phase === 'loaded' ? load.state : null;

  return (
    <AppShell state={state} offline={offline}>
      {load.phase === 'loading' && (
        <LoadingRegion label="Reading word from the outpost…" minHeight="24rem" />
      )}
      {load.phase === 'error' && <ErrorRegion message={load.message} onRetry={reload} />}
      {load.phase === 'loaded' && <Screen offline={offline} />}
    </AppShell>
  );
}

/**
 * Route dispatch.
 *
 * `/settlement/<site>` and the three forge paths are parsed here rather than in
 * the router: prefix matches and a fixed set of literals are not "loaders,
 * params or nested layouts", which is the trigger `router.tsx` names for
 * reconsidering React Router.
 *
 * Every forge route is addressable in every lifecycle state, so each screen is
 * responsible for stating what is true when it cannot offer what it is for.
 */
function Screen({ offline }: { readonly offline: boolean }) {
  const { path } = useRouter();
  const { load } = useSettlementState();

  if (load.phase !== 'loaded') {
    return null;
  }

  const construction = path.startsWith('/settlement/')
    ? path.slice('/settlement/'.length)
    : null;

  if (construction !== null) {
    return (
      <Construction
        state={load.state}
        kind={kindFromSlug(construction, load.state.buildings)}
        offline={offline}
      />
    );
  }

  if (path === '/settlement') {
    return <Settlement state={load.state} />;
  }

  if (path === '/forge') {
    return <Forge state={load.state} />;
  }

  if (path === '/forge/new') {
    return <CraftProject state={load.state} offline={offline} />;
  }

  if (path === '/forge/destination') {
    return <Destination state={load.state} offline={offline} />;
  }

  // A mistyped forge address is a stated not-found with a way back, never a
  // silent fall-through to the home screen.
  if (path.startsWith('/forge/')) {
    return <NotFound />;
  }

  return <Outpost state={load.state} />;
}

/**
 * Connectivity, from the real platform endpoint.
 *
 * Prompt 2 proved the browser can call the backend; that call is kept and put
 * to work driving the offline state, rather than deleted or simulated.
 */
function useConnectivity(): boolean {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getPlatformStatus(controller.signal)
      .then(() => {
        if (!controller.signal.aborted) {
          setOffline(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setOffline(true);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  return offline;
}
