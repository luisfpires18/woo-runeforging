import type { ReactNode } from 'react';

/**
 * The loading, empty and error states from COMPONENTS-AND-STATES.md §2.
 *
 * None of them renders a primary action: loading knows nothing yet, and an
 * error offers a retry rather than a next move (§4 of that document).
 */

export function LoadingRegion({ label, minHeight }: { readonly label: string; readonly minHeight?: string }) {
  return (
    <div
      className="state state--loading"
      aria-busy="true"
      aria-live="polite"
      style={minHeight === undefined ? undefined : { minHeight }}
    >
      <span className="state__text">{label}</span>
    </div>
  );
}

export function EmptyRegion({ children }: { readonly children: ReactNode }) {
  // Empty is not an error and never uses the danger colour.
  return <div className="state state--empty">{children}</div>;
}

export function ErrorRegion({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry: () => void;
}) {
  return (
    <div className="state state--error" role="alert">
      <p className="state__text">Could not reach the House. Your work is not lost.</p>
      <p className="state__detail">{message}</p>
      <button type="button" className="button button--secondary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
