import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * A minimal History-API router for the two routes this slice has.
 *
 * React Router was the obvious choice and was rejected on evidence: every
 * release in the 7.x line currently carries at least one high-severity
 * advisory, and two of them touch `<Link>` and `useNavigate` directly. Almost
 * all of the rest are framework-mode and SSR paths a client-only SPA never
 * reaches — but a permanent wall of high-severity audit findings teaches
 * reviewers to ignore audit output, which is a worse outcome than writing
 * forty lines.
 *
 * What NAVIGATION.md §4 actually requires is met here: every screen is
 * addressable by URL, back and forward behave, and refresh returns to the same
 * place. Revisit if routing grows loaders, params or nested layouts.
 */

interface RouterValue {
  readonly path: string;
  readonly navigate: (to: string, options?: { readonly state?: unknown }) => void;
  readonly navigationState: unknown;
}

const RouterContext = createContext<RouterValue | null>(null);

/** `history.state` is `any`; read it without letting that spread. */
function readAppState(): unknown {
  const entry: unknown = window.history.state;

  if (typeof entry === 'object' && entry !== null && 'appState' in entry) {
    return (entry as Record<'appState', unknown>).appState;
  }

  return null;
}

export function Router({ children }: { readonly children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname);
  const [navigationState, setNavigationState] = useState<unknown>(readAppState);

  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname);
      setNavigationState(readAppState());
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  const navigate = useCallback((to: string, options?: { readonly state?: unknown }) => {
    const appState = options?.state ?? null;
    window.history.pushState({ appState }, '', to);
    setPath(to);
    setNavigationState(appState);
  }, []);

  const value = useMemo<RouterValue>(
    () => ({ path, navigate, navigationState }),
    [path, navigate, navigationState],
  );

  return <RouterContext value={value}>{children}</RouterContext>;
}

export function useRouter(): RouterValue {
  const value = useContext(RouterContext);

  if (value === null) {
    throw new Error('useRouter must be used inside a Router.');
  }

  return value;
}

/**
 * An in-app link. A real anchor, so it is focusable, announced as a link and
 * works with middle-click and "open in new tab" — modifier clicks fall through
 * to the browser.
 */
export function Link({
  to,
  children,
  className,
  state,
}: {
  readonly to: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly state?: unknown;
}) {
  const { navigate } = useRouter();

  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
          return;
        }
        event.preventDefault();
        navigate(to, { state });
      }}
    >
      {children}
    </a>
  );
}
