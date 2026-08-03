# ADR-0015 — Frontend routing, test runner and the Node floor

**Status:** Accepted
**Date:** 3 August 2026
**Supersedes:** [ADR-0012](0012-frontend-stack.md) — in part. The single
TypeScript decision stands; the "no test runner yet" and "no router" positions
are replaced.

---

## Context

ADR-0012 settled React 19, Vite 8 and one plain `typescript@6.0.3`, and deferred
two things with named triggers:

> **No test runner yet.** Vitest arrives at Prompt 5, when there are components
> worth testing.

Prompt 5 is that moment. It also needs routing, which ADR-0012 never addressed
because Prompt 2's shell had one screen.

`NAVIGATION.md` §4 requires every screen to be addressable by URL, with working
back, forward and refresh. That is a real requirement, not a preference: a
player who bookmarks the settlement or presses back after opening it should not
be thrown to the House Seat.

## Decision

### Routing: a project-owned History-API router, not React Router

`react-router-dom` was the obvious choice, was installed, and was removed after
`npm audit`.

**Every release in the React Router 7 line currently carries at least one
high-severity advisory.** Installing 7.18.2 reported two; pinning to 7.11.0 —
below that advisory's range — simply surfaced a different set. The line is
covered end to end:

| Advisory | Affected |
|---|---|
| XSS via open redirects | `>=7.0.0 <=7.11.0` |
| SSR XSS in `ScrollRestoration` | `>=7.0.0 <7.12.0` |
| turbo-stream RCE via `TYPE_ERROR` deserialization | `>=7.0.0 <=7.14.1` |
| `__manifest` endpoint DoS | `>=7.0.0 <7.15.0` |
| Server-action CSRF | `>=7.0.0 <=7.11.0` |
| RSC-mode CSRF bypass | `7.12.0 – 8.2.0` |
| Open redirect via backslash in `<Link>` and `useNavigate` | current |

Most describe framework-mode, SSR and server-action paths that a client-only SPA
never reaches. **But two touch `<Link>` and `useNavigate` directly**, which is
exactly what we would use — and a permanent wall of high-severity findings in
`npm audit` teaches reviewers to ignore audit output, which is a worse long-term
outcome than the code it saves.

This slice needs **two static routes** with no params, no loaders, no data APIs
and no redirects. `src/app/router.tsx` is roughly forty lines over
`history.pushState` and `popstate`, and meets `NAVIGATION.md` §4 in full.
`<Link>` renders a real anchor, so focus, middle-click and "open in new tab"
behave.

**Revisit when** routing needs loaders, route parameters, nested layouts or
code-splitting — or when React Router publishes a release with a clean audit.
At that point the cost/benefit flips and this router should be deleted rather
than grown.

### Test runner: Vitest with Testing Library

`vitest` 4.1.10, `jsdom` 30.0.1, `@testing-library/react` 16.3.2,
`@testing-library/jest-dom` 7.0.0, `@testing-library/user-event` 14.6.1, and
**`@testing-library/dom` 10.4.1 declared explicitly** — it is a peer dependency
of `@testing-library/react`, so relying on it arriving transitively is luck
rather than a decision.

Behaviour-level tests, not snapshots: a snapshot of a mock proves only that the
mock has not changed.

`npm run test` joins lint, typecheck and build in CI and in `AGENTS.md` §7.

### Node floor: 22.22.2

`jsdom@30.0.1` declares `engines: { node: '^22.22.2 || ^24.15.0 || >=26.0.0' }`.

`package.json` `engines` records the **requirement** as `>=22.22.2`; `.nvmrc`
records the **version in use**, currently `22.23.2`. Keeping them separate means
a patch release of the 22 line can be adopted without touching a stated
requirement.

This is a real raise — the previous floor was 22.12.0 for Vite 8. The
development machine was on 22.18.0 and reported `EBADENGINE`; it was upgraded to
22.23.2 rather than the dependency downgraded to fit it.

### The adapter boundary is a lint rule

`no-restricted-imports` forbids `src/features/**` and `src/components/**` from
importing anything under `api/fake/`. A grep-based test would catch the same
thing later and less clearly; a lint rule fails in the editor, at the moment the
import is written.

## Alternatives considered

**Keep React Router and accept the advisories.** Rejected: two of them touch the
APIs we would actually use, and normalising a red audit is a habit that costs
more than it saves.

**Hash routing to avoid a router entirely.** Rejected: `#/settlement` is not a
real URL for sharing or server-side routing later, and the History API is not
meaningfully harder.

**Snapshot tests.** Rejected: they lock in markup rather than behaviour, and
every intentional change becomes a diff to approve rather than a decision to
make.

**Downgrade jsdom to stay on Node 22.18.** Rejected as dishonest — it would hide
a real toolchain requirement behind an older dependency rather than record it.

## Consequences

- One fewer runtime dependency; `npm audit` reports **zero vulnerabilities**.
- The router is ours to maintain. It is small, it is tested through the screens
  that use it, and its revisit trigger is written down.
- **The development machine was upgraded to 22.23.2** to meet the floor. A clean
  `npm ci` installs with no engine warning.
- Frontend tests now gate CI, so a broken component fails the build rather than
  a review.

## References

- `docs/design/NAVIGATION.md` §4 — the URL requirement
- [ADR-0012](0012-frontend-stack.md) — the stack this narrows
- `npm audit` output, 3 August 2026
