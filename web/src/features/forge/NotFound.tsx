import { useEffect, useRef } from 'react';

import { Link } from '../../app/router.tsx';

/**
 * A forge address that names nothing.
 *
 * Every route here is addressable, so a mistyped one is reachable. It states
 * what happened and offers the way back rather than falling through to the home
 * screen, which would look like the link had worked.
 */
export function NotFound() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="forge">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/forge" className="link">
          Forge
        </Link>
        <span aria-hidden="true" className="breadcrumb__separator">
          ›
        </span>
        <span aria-current="page">Unknown</span>
      </nav>

      <header className="intro">
        <p className="intro__eyebrow">Not found</p>
        <h1 className="intro__title" ref={headingRef} tabIndex={-1}>
          No such place in the forge
        </h1>
      </header>

      <div className="theatre">
        <section className="orders orders--commit" aria-labelledby="not-found-heading">
          <div className="orders__head">
            <h2 id="not-found-heading" className="orders__heading">
              Nothing here
            </h2>
          </div>
          <div className="orders__body">
            <p className="orders__state">
              The forge has nothing by that name. The address may be mistyped.
            </p>
          </div>
          <div className="task__actions">
            <Link to="/forge" className="button button--secondary">
              Back to the forge
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
