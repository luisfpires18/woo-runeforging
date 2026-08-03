import { useEffect, useState } from 'react';

import { getPlatformStatus } from '../api/client.ts';
import { useHouseState } from '../api/HouseStateProvider.tsx';
import { ErrorRegion, LoadingRegion } from '../components/StateRegion.tsx';
import { HouseSeat } from '../features/houseSeat/HouseSeat.tsx';
import { Settlement } from '../features/settlement/Settlement.tsx';
import { AppShell } from './AppShell.tsx';
import { useRouter } from './router.tsx';

export function App() {
  const { load, reload } = useHouseState();
  const offline = useConnectivity();

  const state = load.phase === 'loaded' ? load.state : null;

  return (
    <AppShell state={state} offline={offline}>
      {load.phase === 'loading' && (
        <LoadingRegion label="Reading word from the House…" minHeight="24rem" />
      )}
      {load.phase === 'error' && <ErrorRegion message={load.message} onRetry={reload} />}
      {load.phase === 'loaded' && <Screen />}
    </AppShell>
  );
}

function Screen() {
  const { path } = useRouter();
  const { load } = useHouseState();

  if (load.phase !== 'loaded') {
    return null;
  }

  if (path === '/settlement') {
    return <Settlement state={load.state} />;
  }

  return <HouseSeat state={load.state} />;
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
