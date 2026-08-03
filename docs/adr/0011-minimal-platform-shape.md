# ADR-0011 — Minimal platform shape

**Status:** Accepted
**Date:** 3 August 2026
**Supersedes:** [ADR-0001](0001-platform-and-runtime-shape.md),
[ADR-0004](0004-consistency-and-durable-work.md),
[ADR-0006](0006-module-boundaries-and-progression-order.md),
[ADR-0008](0008-api-and-access-boundary.md)

---

## Context

Prompt 1 produced an architecture for the finished game: an API process and a
separate worker process, eight assemblies in a tier graph, a `SKIP LOCKED`
durable-job engine with leases and poison handling, a transactional outbox, and
architecture tests to enforce the module direction.

The updated planning documents then reduced the target. The Workbase now says:

> Begin with one ASP.NET Core modular monolith and one PostgreSQL database. Keep
> background work inside the application until measured need justifies a
> separate worker.

and Prompt 2 explicitly forbids a separate worker, background-job
infrastructure, an outbox, and architecture-test frameworks.

None of the deferred machinery was ever built, so this is not a rollback of
working code. It is a correction of a design that ran ahead of the product.

The substantive question is whether removing durable jobs leaves a hole. It does
not, because of how elapsed time is modelled: construction, crafting, training
and production are **stored timestamps resolved when state is read**, not tasks
that must fire at a moment. A player away for three days has their progress
computed on the next request. The job engine existed to run completions on time;
nothing needs to run on time.

## Decision

**One ASP.NET Core 10 application, organised by feature folder, with one
PostgreSQL database.**

1. **One process.** `src/Woo.Api` serves the API and, when gameplay eventually
   needs it, hosts small in-process background work. No second runtime unit.
2. **Feature folders, not projects.** A feature owns its endpoints, handlers and
   persistence configuration in one directory. Boundaries are held by review and
   by folder structure, not by assembly references or an architecture-test
   framework — with two projects there is nothing for such a framework to prove.
3. **Folders appear when a feature does something.** Houses, Settlements,
   Resources, Forge, Armies and Battles are named in
   [`ARCHITECTURE.md`](../architecture/ARCHITECTURE.md#4-feature-folders) as the
   first-slice organisation, but are not created empty. Workbase §19: future
   systems "do not need projects, tables, services, or empty abstractions before
   use".
4. **No durable-job engine, no outbox, no idempotency keys yet.** Elapsed time
   resolves from timestamps. Idempotency arrives at Prompt 9, and only for
   commands a client may realistically submit twice.
5. **REST under `/api/v1`.** Kept from ADR-0008 because a version segment costs
   nothing now and renaming every route later is a breaking change. ETag
   concurrency, poll hints and the actor/authorization boundary are deferred
   until there is House state to guard.

## Alternatives considered

**Keep the worker and the job engine.** Rejected: it is roughly a thousand lines
of infrastructure serving zero features, it doubles the local run story, and the
timestamp model means completions do not need to be scheduled. If a future
feature genuinely cannot resolve on read, that measured case reopens this.

**Keep the eight-assembly tier graph without the worker.** Rejected: assembly
boundaries are a tool for enforcing direction between many modules. With two
projects they only add project files and build time. Folders express the same
intent and can be promoted to projects if the codebase earns it.

**Split now to avoid a painful split later.** Rejected on evidence. Extracting a
worker from a monolith that already keeps its work in handlers is mechanical;
the expensive version of that migration is the one that also has to untangle
shared mutable state, which is a different problem and one this design avoids
regardless.

## Consequences

- The whole runtime is one process and one database. A new contributor can run
  it after reading one page.
- Any work that must survive a crash and cannot be recomputed from stored state
  has nowhere to go today. That constraint is deliberate: it forces the
  timestamp model to be used properly rather than routed around.
- Module direction is not mechanically enforced. Reviews carry it. This is
  acceptable while the module count is small and is the named trigger for
  reopening.
- The medieval-first rule ("rune gameplay cannot leak into the foundation") is no
  longer enforced by a compile error. It is enforced by runes not existing:
  there is no Runes folder, no rune table and no rune content.

**Revisit when:** in-process work measurably cannot complete safely at request
time; or a post-commit reaction must survive a crash and cannot be recomputed;
or the module count makes review-based boundary enforcement unreliable.
