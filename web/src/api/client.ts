/**
 * The single seam between the web client and the backend.
 *
 * Every later feature adds its calls here rather than fetching from a
 * component, so replacing mock state with real endpoints stays a change in one
 * file instead of a rewrite of the components.
 */

export interface PlatformStatus {
  readonly application: string;
  readonly environment: string;
  readonly utcNow: string;
  readonly database: {
    readonly connected: boolean;
  };
}

export async function getPlatformStatus(signal?: AbortSignal): Promise<PlatformStatus> {
  const response = await fetch('/api/v1/platform/status', {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`The API returned ${String(response.status)} ${response.statusText}.`);
  }

  return (await response.json()) as PlatformStatus;
}
