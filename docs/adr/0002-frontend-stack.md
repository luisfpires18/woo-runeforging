# ADR-0002 — Frontend stack and the TypeScript compiler pair

**Status:** Accepted
**Date:** 1 August 2026

---

## Context

The client is a management-heavy application interface — settlement view, forge
projects, markets, armies, reports, history — plus a battle replay renderer. It
must be responsive, work on mobile, and run behind a login.

Two constraints shape the toolchain:

1. The replay renderer must be **completely unable to influence a battle
   outcome** (Workbase §19: "replay rendering never calculates the outcome").
2. TypeScript 7.0 went GA in July 2026 with a Go-native compiler that
   type-checks roughly 8–12× faster — but it **ships without a programmatic
   API**, which arrives in 7.1. `typescript-eslint`, `ts-jest` and `ts-morph`
   all import the classic compiler API from the bare specifier `typescript` and
   call `getTypeChecker()`. Installing `typescript@7` alone breaks type-aware
   linting outright: the published `typescript-eslint` peer range excludes it
   and npm fails with `ERESOLVE`.

The product owner's stated preference was TypeScript 7.x if the toolchain fully
supports it, with a documented 6.x fallback.

## Decision

**React 19.2 · Vite 8 · TypeScript 7.0 and 6.0 side by side · PixiJS 8
(from Prompt 7).**

Because tools resolve `typescript` **by name through peer dependencies**, the
package installed under that name must be the one that still has an API. The
fast compiler therefore goes under an alias and the compatible one keeps the
plain name:

```jsonc
// web/package.json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2",
    "typescript-eslint": "^8.x"
  }
}
```

**`@typescript/native` is not a published package** — it 404s on npm, and that is
correct. In `npm:` alias syntax the left side is an arbitrary local name and the
right side is what gets installed. Verified against the registry on
1 August 2026:

| Installed under | Real package | Declares `bin` |
|---|---|---|
| `@typescript/native` | `typescript@7.0.2` | `tsc` |
| `typescript` | `@typescript/typescript6@6.0.2` | `tsc6` |

Different executables, so nothing collides. `npx tsc` runs TypeScript 7, `npx
tsc6` runs TypeScript 6, and anything resolving the bare specifier `typescript`
gets the TypeScript 6 API that still exists.

Also verified: `typescript-eslint`'s published peer range is
`typescript: ">=4.8.4 <6.1.0"` — TypeScript 7 is excluded outright, so this is
not a preference but a hard installation constraint.

| Script | Command | Compiler | Purpose |
|---|---|---|---|
| `npm run typecheck` | `tsc --noEmit` | TypeScript 7.0.2 | Authoritative type check, local and CI |
| `npm run lint` | `eslint .` | TypeScript 6.0.2 *(via module resolution)* | `typescript-eslint` type-aware rules |
| `npm run build` | `vite build` | Vite 8 / Oxc | Transpile only — never type-checks |

TypeScript 7.0 is designed to type-check identically to 6.0 with
`stableTypeOrdering` enabled and no `ignoreDeprecations`, so the two agree on
what constitutes an error.

**Supporting choices:** TanStack Query for server state and polling; TanStack
Router for routing; Zod for runtime validation at the API boundary; React Hook
Form for forms; Vitest and Testing Library for unit and component tests; MSW for
API mocking; Playwright for end-to-end; axe-core for accessibility.

**PixiJS is isolated** in `web/src/render/`. It consumes only the stored
`BattleEventLog`. An architecture test asserts that directory imports no
simulation logic.

## Collapse trigger

When **TypeScript 7.1 ships with its stable programmatic API** *and*
**`typescript-eslint` releases support for it**, delete the alias pair and
depend on `typescript@7` alone. Until both conditions hold, the pair stays.

This is the documented review point. Do not attempt the collapse on 7.1's
release alone — the linter release is the binding constraint.

## Alternatives considered

### TypeScript 6.0.x only

The plainest reading of the stated fallback: one compiler, no alias, everything
in the ecosystem works today. Rejected because the alias pair is Microsoft's own
documented configuration for exactly this situation, costs one `package.json`
stanza and one ADR, and buys an 8–12× faster type check on every local run and
every CI job for the life of the project. The fallback remains available if the
pair causes trouble — reverting is deleting one line.

### TypeScript 7 alone, dropping type-aware lint rules

Rejected. Type-aware rules catch the class of bug that matters most at an API
boundary — floating promises, unsafe `any` propagation, incorrect nullability.
Trading them for compiler speed is a bad exchange.

### Next.js instead of a Vite SPA

Rejected in [ADR-0001](0001-platform-and-runtime-shape.md). SSR has no value
behind a login and complicates PixiJS.

### A different renderer (Canvas 2D, Three.js, DOM)

Deferred rather than rejected. PixiJS is the Workbase's stated preference and
suits 2D sprite-and-banner replay. The isolation boundary means swapping it is a
contained change. **Not installed until Prompt 7** — no dependency is added
before the prompt that needs it.

## Consequences

**Positive**

- Fast type-checking on every save and every CI run.
- Type-aware linting retained, so the boundary bugs stay caught.
- Vite 8's Rolldown bundler gives fast production builds.
- The renderer cannot affect outcomes, enforced by an architecture test.

**Negative / accepted costs**

- Two TypeScript packages in `devDependencies` needs an explanatory comment and
  this ADR. A newcomer reading `package.json` will find the aliasing surprising.
- The `typecheck` and `lint` scripts run different compilers, so a discrepancy
  between them is possible in principle. Treated as a bug to report upstream if
  it occurs; the stated compatibility guarantee makes it unlikely.
- Node 24 is required, above the currently installed Node 22.18.

**Neutral**

- `npm` is the package manager, matching what is installed. No pnpm or yarn.

## References

- [`ARCHITECTURE.md §2.1`](../architecture/ARCHITECTURE.md#21-typescript-two-compilers-on-purpose)
- [`ARCHITECTURE.md §11`](../architecture/ARCHITECTURE.md#11-api-style-and-polling)
- Workbase §2 — visual direction and PixiJS
