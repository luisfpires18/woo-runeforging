# ADR-0012 — Frontend stack and a single TypeScript compiler

**Status:** Superseded in part by [ADR-0015](0015-frontend-routing-and-tests.md)
**Date:** 3 August 2026
**Supersedes:** [ADR-0002](0002-frontend-stack.md)

> **Partly superseded by [ADR-0015](0015-frontend-routing-and-tests.md) on 3 August 2026.**
> The single-TypeScript decision below still stands. What changed: a test
> runner now exists (Vitest, as this ADR's own trigger anticipated), routing
> is a project-owned History-API router rather than React Router, and the
> Node floor rose to 22.22.2.

---

## Context

ADR-0002 installed **two TypeScript compilers** side by side:

```jsonc
{
  "@typescript/native": "npm:typescript@^7.0.2",
  "typescript": "npm:@typescript/typescript6@^6.0.2"
}
```

The reasoning was sound as far as it went. TypeScript 7.0 is a Go-native
compiler that type-checks far faster but ships without the programmatic API;
`typescript-eslint` resolves the bare specifier `typescript` and calls
`getTypeChecker()`, so the name `typescript` had to hold a compiler that still
had an API. Hence an alias pair, two binaries (`tsc` and `tsc6`), and a
paragraph of documentation explaining why `npm view @typescript/native` returns
404.

That is a large amount of explanation for a project with one `App.tsx`. It is
also unnecessary. Registry checks on 3 August 2026:

```
$ npm view typescript versions        → … "6.0.2", "6.0.3", "7.0.1-rc", "7.0.2"
$ npm view typescript@6.0.3 bin       → { tsc: 'bin/tsc', tsserver: 'bin/tsserver' }
$ npm view typescript-eslint peerDependencies
  { eslint: '^8.57.0 || ^9.0.0 || ^10.0.0', typescript: '>=4.8.4 <6.1.0' }
```

**`typescript@6.0.3` is published under the plain package name**, provides the
ordinary `tsc` binary, and sits inside `typescript-eslint`'s peer range. One
install does everything the pair did.

## Decision

**React 19 + Vite 8 + one plain `typescript@6.0.3`.**

| Script | Command | Purpose |
|---|---|---|
| `npm run typecheck` | `tsc --noEmit` | Authoritative type check |
| `npm run lint` | `eslint .` | Type-aware `typescript-eslint` rules |
| `npm run build` | `tsc --noEmit && vite build` | Type check, then transpile |

- **No alias entries, no `tsc6`, no `@typescript/*` scope** in `node_modules`.
- Vite never type-checks — it transpiles through Oxc — which is why `build`
  runs `tsc --noEmit` first rather than trusting the bundler.
- ESLint flat config: type-aware rules scoped to `**/*.{ts,tsx}` via
  `projectService`, with `disableTypeChecked` for the plain-JavaScript config
  file itself.
- **No PixiJS.** It enters at Prompt 7 with the first battle replay.
- **No test runner yet.** Vitest arrives at Prompt 5, when there are components
  worth testing. Until then the frontend gates are lint, typecheck and build.

## Alternatives considered

**Keep the alias pair for TypeScript 7's speed.** Rejected. The measured benefit
is seconds on a codebase of a few hundred lines, against a permanent cost: two
compilers to keep in step, a non-obvious `bin` mapping, and a documented 404 that
every newcomer has to be told is expected. Revisit if type-checking ever becomes
a real part of the feedback loop.

**TypeScript 7 alone, dropping type-aware linting.** Rejected. Type-aware rules
(`no-floating-promises`, `await-thenable`, `no-misused-promises`) are the ones
that catch real defects in async React code. Losing them to gain compile speed is
a bad trade.

**Next.js instead of Vite.** Out of scope here — the backend is ASP.NET Core and
server rendering buys nothing for an authenticated game client. Recorded in
ADR-0001's original comparison.

## Consequences

- `web/package.json` has one entry for TypeScript and needs no explanation.
- The project tracks TypeScript 6.0.x. Version 7 is not adopted until
  `typescript-eslint` supports it.
- Type checking is slower than TypeScript 7 would be. At this size that is not
  measurable.
- `tsconfig.json` sets `"types": ["vite/client"]`, which is what supplies the
  ambient declaration for side-effect CSS imports under TypeScript 6.

**Revisit when:** TypeScript 7.1 ships with a programmatic API **and**
`typescript-eslint` releases support for it. Then move to `typescript@7` alone —
still a single install.
