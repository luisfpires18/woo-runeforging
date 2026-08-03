# ADR-0001 — Platform and runtime shape

**Status:** Superseded by [ADR-0011](0011-minimal-platform-shape.md)
**Date:** 1 August 2026
**Deciders:** Product owner, principal architect

> **Superseded by [ADR-0011](0011-minimal-platform-shape.md) on 3 August 2026.**
> The separate worker process, and with it the durable-job and outbox machinery this ADR justified, is not built. Prompt 2 ships one ASP.NET Core process.
>
> The text below is left unedited as the record of what was designed and
> why it was cut back. Do not treat it as current.

---

## Context

Weapons of Chaos and Order is a server-authoritative, persistent, asynchronous
multiplayer strategy RPG. It must support elapsed-time resource production,
asynchronous construction, deterministic battalion battles with visual replay,
auditable Runeforging outcomes with destructive failures, immutable
unique-object constraints, markets, Orders, Warfronts, seasons and history.

The operational target is local development first, then a closed test of about
twenty players on an Azure for Students subscription with a $100 annual credit.

The project owner has strong C#/.NET experience. Prompt 1 of the implementation
contract requires comparing at least two options before recommending one.

The repository is greenfield: two planning documents and nothing else. No
existing code constrains the choice.

## Decision

Build an **ASP.NET Core 10 modular monolith** plus a **separate .NET worker
process** sharing the same application and infrastructure assemblies.

**Runtime units:**

| Unit | Role |
|---|---|
| `Woo.Api` | HTTP boundary — commands, read models, health. Also serves the built SPA |
| `Woo.Worker` | Durable due-job execution, outbox dispatch, lease recovery |
| Migrator entrypoint | EF Core migrations, run before a new API revision |
| `Woo.Simulation` | A pure library, not a runtime unit |
| `tools/Woo.Sim.Cli` | Headless balance simulation, never deployed |

Two deployed units, one database, one object store.

**Explicitly rejected for the initial architecture:** microservices, Kubernetes,
Redis, and any message broker. Each has a named revisit threshold below.

## Alternatives considered

### Option B — Next.js with TypeScript and a separate durable worker

Rejected. Detailed comparison:

| Dimension | Option A (chosen) | Option B |
|---|---|---|
| Owner expertise | Strong C#/.NET — direct fit | Relearn the server half in TypeScript |
| Deterministic numerics | Explicit `long`/`int`, `checked` contexts | JS numbers are IEEE-754 doubles; integer-safe economy math needs BigInt discipline everywhere |
| Simulation purity | A separate assembly with banned-API analyzers makes impurity a build error | Simulation shares a language and package space with UI; purity is a convention |
| Durable background work | First-class Generic Host with DI parity to the API | Needs a second runtime (BullMQ, pg-boss, Inngest) |
| Module enforcement | Compile-time project references plus NetArchTest | Convention and lint rules |
| Migrations | EF Core migrations, compile-checked model | Drizzle/Prisma are capable, but more manual at this schema size |
| SSR value | None needed — the product is an authenticated app shell | Next.js SSR/RSC adds cost and complexity for no benefit behind a login |
| PixiJS integration | Plain SPA canvas | Requires `"use client"` and SSR escape hatches |
| Portability | Plain OCI containers | Same |

Option B's advantage is a single language across the stack. That is real, but it
is outweighed by the owner's existing expertise landing exactly on the parts of
this system that are genuinely hard — determinism, transactional integrity,
ledgers and invariants — and by compile-time enforcement of the module
boundaries that keep runes out of the medieval foundation.

### Microservices

Rejected. Every invariant in Workbase §19 is transactional and cross-module:
ledgers, exclusive destinations, one-outcome attempts. Distribution converts
each into a distributed-transaction problem for no benefit at twenty players.

**Revisit when:** a module demonstrates an independent scaling or release need
under measurement.

### Kubernetes

Rejected. Two containers. Container Apps Consumption provides scale-to-zero
without a control plane to operate or pay for.

**Revisit when:** multi-region, or more than roughly ten services with
independent lifecycles.

### Redis

Rejected. PostgreSQL `FOR UPDATE SKIP LOCKED` handles orders of magnitude more
throughput than this workload. Adding Redis adds a service, a failure mode and
a cost line.

**Revisit when:** sustained job throughput above roughly 50/second, or a
cross-process cache need demonstrated by profiling.

### Message broker

Rejected. One process consumes the outbox. A broker would add delivery semantics
the transactional outbox already provides.

**Revisit when:** fan-out to independently deployed consumers, or cross-service
ordering guarantees.

### One combined process (API executes its own background work)

Rejected. It would hide the failure modes the product depends on — restart
safety, lease recovery, duplicate-delivery tolerance — until they appeared in
front of real players. A separate worker forces those contracts to be real from
Prompt 9.

## Consequences

**Positive**

- The authoritative half is entirely C#, matching the owner's strongest skills.
- Module boundaries are enforced by the compiler, not by review discipline.
- Domain and simulation tests need no host, database or network.
- Two containers fit comfortably inside Azure for Students, with the worker as a
  scheduled job costing nothing when idle.
- Plain OCI containers keep Docker Compose and a VPS as real deployment targets.

**Negative / accepted costs**

- Two languages in the repository (C# server, TypeScript client). Mitigated by
  generating the client API types from the OpenAPI document.
- A modular monolith can decay into a big ball of mud without enforcement.
  Mitigated by the architecture tests in ADR-0006.
- Scaling is vertical first. Accepted deliberately at this scale; the horizontal
  path is documented and unblocked.

**Neutral**

- Serving the SPA from the API container couples web and API deploys. Splitting
  them later is a deployment change, not an architecture change.

## References

- [`ARCHITECTURE.md §3`](../architecture/ARCHITECTURE.md#3-runtime-units)
- [`ARCHITECTURE.md §7.4`](../architecture/ARCHITECTURE.md#74-what-is-deliberately-not-used)
- Workbase §19 — technical foundation and "do not use initially"
