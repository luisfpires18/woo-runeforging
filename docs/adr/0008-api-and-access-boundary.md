# ADR-0008 — API style, polling and the access boundary

**Status:** Superseded by [ADR-0011](0011-minimal-platform-shape.md)
**Date:** 1 August 2026

> **Superseded by [ADR-0011](0011-minimal-platform-shape.md) on 3 August 2026.**
> The `/api/v1` prefix and problem-details error shape survive. ETag concurrency, the server-computed poll hint, `ActorContext` and the split private/public read models are deferred until there is state to guard.
>
> The text below is left unedited as the record of what was designed and
> why it was cut back. Do not treat it as current.

---

## Context

Two questions, both with a "do it now or do it later" shape.

**Transport.** The game is asynchronous: things complete on timers measured in
minutes. Does the client poll, or does the server push? Push is more elegant and
costs a WebSocket transport, a reconnection story, a scaling component and a
second code path for every read.

**Authentication.** Prompt 25 adds accounts, twenty-four prompts after the
architecture is fixed. Authorization decisions made badly now become a
multi-tenant data leak later — but implementing authentication early violates
the prompt sequence and would be built against no real requirements.

The Workbase adds a specific hazard: Prompt 27 introduces public market and
Warfront projections. Public read models built by stripping fields from private
ones leak, eventually, when someone adds a field.

## Decision

### API style

REST under `/api/v1/…`, JSON. `application/problem+json` (RFC 9457) for every
error — one error shape, machine-readable, carrying a correlation ID.

Versioning by URL segment: additive changes within a version, a new segment for
anything breaking.

**Concurrency:** `ETag` derived from the aggregate's `xmin`. Mutating requests
send `If-Match`; a mismatch returns `412 Precondition Failed`.

**Idempotency:** every mutating request carries `Idempotency-Key`
([ADR-0004](0004-consistency-and-durable-work.md)).

### Polling, with a server-computed hint

`GET /api/v1/houses/{id}/state` returns an `ETag` and honours `If-None-Match`
with `304`. The body carries **`nextPollAfterSeconds`**, computed server-side
from the nearest due job — so the client polls quickly when something is about
to complete and slowly when nothing is pending. Battle status polls with backoff
until `resolved`.

Twenty players at a ten-second cadence is roughly two requests per second, and
most return `304` with no body.

### The push trigger, named in advance

**Trigger:** more than roughly 200 concurrent players, **or** a feature that
genuinely needs sub-second shared state — a live Warfront board, a real-time
market.

**Path:** SignalR hosted **in the same ASP.NET Core process**. Container Apps
supports WebSockets, so no Azure SignalR Service is needed at this scale. Push
carries **the same DTOs the poll returns**, so client changes are confined to
the transport layer. Azure SignalR Service enters only if the API outgrows a
single host.

### Authorization boundary without authentication

- `ActorContext { AccountId?, HouseId?, Roles[] }` resolved by
  `IActorContextAccessor`, flowing into every command and query.
- Until Prompt 25, a **`DevActorProvider`** binds it from a header
  (`X-Dev-House`). It **refuses to load when
  `ASPNETCORE_ENVIRONMENT=Production`** — a fail-fast guard in code.
- Handlers already call `IAuthorizationPolicy.EnsureCanCommand(actor, resource)`.
  Prompt 25 fills the policies; it does not add the call sites.
- **Object-level authorization is structural:** every House-owned aggregate
  exposes `HouseId`, and an architecture test asserts House-scoped queries take
  `HouseId` from `ActorContext`, **never** from the request body.
- **`PrivateHouseView` and `PublicHouseView` are distinct DTOs with distinct
  projections** from day one.

## Alternatives considered

### WebSockets or SignalR from the start

Rejected. It solves a problem the product does not have: nothing in the
asynchronous loop needs sub-second delivery, and construction completing 40
seconds late is invisible. The cost is a persistent connection per client, a
reconnection and resume story, message ordering concerns, and a second read path
to keep consistent with the polled one. Deferred with a named trigger rather
than dismissed.

### Server-Sent Events

Rejected for now, but noted as the cheaper middle option if push becomes
justified for one-way updates only. It would avoid the bidirectional machinery
of WebSockets. Reconsider at the same trigger point.

### Fixed-interval client polling

Rejected. A fixed short interval wastes requests when nothing is pending; a
fixed long interval makes completions feel unresponsive. The server knows when
the next job is due, so it should say so. `nextPollAfterSeconds` costs one field.

### GraphQL

Rejected. The read models are few, shaped by specific screens, and the write
side is command-oriented. GraphQL's flexibility would mostly create a caching
and authorization surface to defend. REST plus purpose-built read models is a
better fit and keeps `ETag` caching trivial.

### gRPC

Rejected. Browser support requires a proxy, and the API is consumed by one
first-party web client where JSON over HTTP is entirely adequate.

### Header or query versioning instead of URL segments

Rejected. URL segments are visible in logs, cacheable, and obvious in a support
conversation.

### Implementing authentication now

Rejected — it violates the prompt sequence and would be built without real
requirements. The chosen middle path costs the `ActorContext` plumbing and gets
the hard part (object-level authorization, public/private separation) right
while it is still cheap.

### Deriving public read models by omitting fields from private ones

Rejected. It fails open: adding a field to the private model silently exposes it
unless someone remembers to exclude it. Separate DTOs fail closed.

## Consequences

**Positive**

- No transport infrastructure to operate or fund during the closed test.
- `304` responses make polling nearly free in bandwidth and compute.
- The polling cadence adapts to game state without client-side guesswork.
- Adding authentication at Prompt 25 changes no handler signature.
- Public projections cannot leak private state by omission.
- `ETag` and `If-Match` give optimistic concurrency without a version column.

**Negative / accepted costs**

- Up to one poll interval of latency on a completion. Invisible at this game's
  pace, and the hint keeps it short when it matters.
- `ActorContext` plumbing exists before it does anything, which will look like
  ceremony to a reader who does not know Prompt 25 is coming. Documented here.
- Two view models per aggregate where one would do today.

**Neutral**

- The push migration is a real project when it comes, but it is scoped, and the
  DTO reuse keeps it away from feature code.

## References

- [`ARCHITECTURE.md §10`](../architecture/ARCHITECTURE.md#10-authentication-and-authorization-boundary)
- [`ARCHITECTURE.md §11`](../architecture/ARCHITECTURE.md#11-api-style-and-polling)
- [`ARCHITECTURE.md §15.7`](../architecture/ARCHITECTURE.md#157-access)
- Prompt 25, Prompt 27
