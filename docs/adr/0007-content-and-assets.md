# ADR-0007 — Authored content and assets

**Status:** Accepted
**Date:** 1 August 2026

---

## Context

Almost everything the game does is data: kingdoms, regions, settlement stages,
buildings, production rules, resources, material families, weapon patterns,
grades, techniques, company archetypes, terrain, battle rules, rune families,
contracts, Situations and asset keys.

Two hard requirements shape the design:

- **"Active content remains resolvable after content updates"** (Workbase §19).
  A player holding an open contract created under last week's rules must still
  be able to complete it after a balance patch.
- **"Missing art cannot block play"** (Prompt 28). Art arrives late and
  incrementally; a missing file must degrade, never break.

A third requirement follows from the forge: Prompt 12 must be able to "explain
an old batch after balance rules change", which means every crafted object has
to remember which rules produced it.

## Decision

### Format and identifiers

JSON files under `content/`, validated against JSON Schema files under
`content/schemas/`.

Identifiers are **stable, human-readable, namespaced strings** — `resource.ore`,
`building.forge`, `pattern.sword.infantry.arkazian`, `rune.fire`,
`kingdom.arkazia`. **Never renumbered, never reused.** Removal is
`retired: true`, never deletion, because persisted rows reference these IDs
forever.

### Versioning

`content/manifest.json` carries a `contentVersion` such as `2026.08.01+3` plus a
SHA-256 per file. Content is **baked into the container image** — no runtime
fetch, so the API and worker cannot disagree about what a rule says.

Every persisted craft, battle, attempt and situation row stores
`content_version` **and** `rules_version`.

### Retention is reference-driven

```
app.content_version_registry (version text pk, published_at_utc,
                              sha256 text, bundle_present boolean)
```

**A version may be unloaded only when a query proves zero live references.**
Liveness spans every table storing a `content_version` whose owning row is
non-terminal: active crafts and construction, scheduled or unapplied battles,
open contracts and market orders, in-flight Situations, unresolved Runeforging
attempts, and anything with a requestable replay.

On startup the process loads every live-referenced version plus the current one.

> **If a live-referenced version's bundle is missing from the image, startup
> fails loudly.**

Retiring a version is an explicit operator action that runs the liveness query
first and reports what still holds it.

### Validation

`tools/Woo.Content.Validator` runs in CI and locally and fails hard on: schema
violation, duplicate identifier, unresolvable cross-reference, illegal authored
state transition, unsupported rune fusion, and **any asset fallback chain that
does not terminate**.

### Assets

`content/assets/manifest.json` maps
`assetKey → { path, sha256, width, height, variants[], fallbackKey }`.

`IObjectStore { GetUrl, Put, Exists, Delete }` is declared in `Woo.Application`.
The adapter is `AzureBlobObjectStore`, pointed at **Azurite** locally and Azure
Blob Storage in the cloud — same SDK, same code path, no local/cloud drift. The
port is shaped so an S3 adapter is a drop-in.

Content-addressed paths `assets/{sha[0:2]}/{sha}.webp` with
`Cache-Control: public, max-age=31536000, immutable`. A new asset is a new path,
so cache invalidation never arises.

Every asset key declares a `fallbackKey` chain terminating at a
guaranteed-present faction placeholder or heraldic token. **No emoji as game
art.**

## Alternatives considered

### A fixed cap of two loaded content versions

**Rejected — this was an error in an earlier draft.** Any fixed number is
unsafe. A long-running contract, a queued battle, an unclaimed report or an
unresolved Runeforging attempt can outlive an arbitrary window. When it does,
the object becomes unresolvable and the player is holding something the server
can no longer explain — precisely the failure Workbase §19 forbids. Retention
must follow references, not a count.

### Content in the database rather than in the image

Rejected for now. It would allow hot content edits without a deploy, which is
attractive for balance iteration. But it introduces a window in which the API
and worker hold different catalogs, requires its own versioning and publication
workflow, and makes "what content was live at 14:32" a query rather than an
image tag. Baking into the image makes the deployed artefact fully
self-describing.

**Revisit when:** balance iteration during a live test proves too slow, at which
point a database-backed overlay for numeric values only — not structure — is the
narrower change.

### Numeric or GUID content identifiers

Rejected. Human-readable IDs make support queries, content review, git diffs and
error messages legible. The cost is that IDs must be chosen carefully once; the
`retired` flag handles the rest.

### Fetching assets through the API

Rejected. It would put binary traffic through the compute tier, burning the
Container Apps free grant on bytes a storage account serves better and cheaper.
Content-addressed public blobs with immutable caching are simpler and faster.

### Signed URLs for assets

Rejected for the `assets` container. It holds no personal data, so signing adds
latency, cost and complexity for no protection. A separate private container
exists for anything user-supplied later.

### MinIO or another S3-compatible service locally

Rejected in favour of Azurite. Azurite exercises the *same SDK and adapter* used
in production, so local success is evidence about production. MinIO would test a
different code path.

## Consequences

**Positive**

- A balance change cannot orphan in-flight work — the deploy is refused at boot
  instead.
- An old batch can always be explained, because its rules are still loadable.
- Missing art degrades to a placeholder, verified by a build-time check.
- Asset caching is optimal and invalidation is impossible by construction.
- Designers can iterate on JSON without touching application code.

**Negative / accepted costs**

- Content bundles accumulate in the image while old work stays open. Bounded in
  practice by contract and battle lifetimes; visible via the
  `woo.content.live_versions` metric.
- A balance change requires a deploy. Accepted for the closed test.
- The liveness query touches several tables and must be kept current as new
  content-referencing tables appear. Guarded by a test that enumerates
  `content_version` columns and asserts each is covered.

**Neutral**

- JSON Schema is verbose. Worth it for the error messages.

## References

- [`ARCHITECTURE.md §8`](../architecture/ARCHITECTURE.md#8-authored-content)
- [`ARCHITECTURE.md §9`](../architecture/ARCHITECTURE.md#9-assets-and-object-storage)
- [`ARCHITECTURE.md §15.6`](../architecture/ARCHITECTURE.md#156-content-assets-and-seasons)
- Workbase §7, §19; Prompt 3, Prompt 28
