# ADR-0009 — Permanent versus seasonal data

**Status:** Accepted
**Date:** 1 August 2026

---

## Context

The Workbase locks a specific promise (§15):

> **Persistent accounts with seasonal conflict and no full account wipes.**

Permanent: House and settlement, specialists and forge mastery, buildings and
profession capability, army roster and doctrine, named and Runeforged weapons,
relationships, titles, history.

Seasonal: active contested regions, Warfront influence and temporary depots,
crisis knowledge and special objectives, rankings and political offices, the
active Chaos or Order storyline.

Workbase §19 requires that permanent and seasonal state are separated, and §22
names offline punishment as a risk that drives adult players away. Prompt 27
requires that "Warfront completion cannot reset permanent progression", and
Prompt 30 requires that "seasonal reset cannot delete permanent progression".

The design question is how to make that separation *structural* rather than a
rule that a future migration might quietly violate.

## Decision

**A single stable seasonal schema group inside `world`.** Seasonal tables carry
a `season_id` column with a foreign key to `world.season(id)`. Permanent tables
carry no `season_id` at all.

```
world.season (id, ordinal, name, state, started_at_utc, ended_at_utc, archived_at_utc)
world.<seasonal_table> (…, season_id uuid not null references world.season(id))
```

**The enforcing invariant:**

> **No foreign key points from a permanent table to a seasonal table.**

Asserted by a catalog test over `pg_constraint`. Permanent progression is
structurally incapable of depending on a season's lifetime.

**Season rollover** inserts a new `world.season` row and marks the previous one
inactive. **Nothing is dropped.**

**Archival and purge** of an old season is an explicit, audited, batched
operation executed as a due job with a reconciliation report — never a schema
drop. It is an operator action with a written procedure, not a side effect of
starting a new season.

## Alternatives considered

### Dynamic per-season schemas with `DROP SCHEMA season_n CASCADE`

**Rejected — this was an error in an earlier draft.** The appeal was that a
seasonal reset becomes one statement and permanent data is untouchable by
construction. The problems are decisive:

- **Migrations cannot target it.** EF Core migrations are generated against a
  known model with known schema names. A schema created at runtime is outside
  the migration system, so seasonal tables would need hand-maintained DDL
  diverging from every other table in the database.
- **The EF model cannot express it.** Entity configuration binds a schema name
  at model-build time. Supporting N seasons means either N model variants or
  runtime model mutation.
- **`DROP … CASCADE` is unrecoverable and indiscriminate.** It follows
  dependencies wherever they lead. A single accidental foreign key — exactly the
  thing the design is trying to prevent — turns a routine rollover into
  permanent data loss with no undo.
- **Dynamic DDL needs elevated privileges** the application should not hold at
  runtime.

A stable schema with `season_id` gets the same isolation guarantee through a
foreign-key constraint that a test can verify, while staying inside migrations,
inside the EF model, and inside ordinary least-privilege operation.

### A `season_id` column on every table, nullable for permanent rows

Rejected. It puts the permanent/seasonal distinction inside a column value
rather than in the schema, so a wrong `WHERE` clause during a reset deletes
permanent data. The distinction should be visible in the table definition.

### Separate databases for permanent and seasonal state

Rejected. It would forbid a single transaction spanning both — and a Warfront
contribution that consumes permanent resources needs exactly that. It also
doubles the operational surface for no gain.

### Soft-delete flags instead of archival

Rejected as the primary mechanism. Rows accumulate forever and every query grows
a filter that someone will eventually forget. Explicit archival with a
reconciliation report is more work to build and far safer to operate.

### No archival at all — keep every season forever

Deferred rather than rejected. At closed-test scale, retaining all seasonal data
is entirely affordable and is the safest default. The archival job is specified
now so it exists before it is needed, but running it is an operator decision,
not an automatic consequence of a rollover.

## Consequences

**Positive**

- "No full account wipes" is a schema property backed by a test, not a promise.
- Seasonal reset cannot touch permanent progression even if someone writes the
  wrong query, because the foreign keys make the dependency direction explicit.
- Seasonal tables stay inside EF migrations and ordinary tooling.
- Archival is auditable and reversible up to the point of purge, with a
  reconciliation report proving what left.
- A season is a row, so "what was the state during season 3" stays queryable.

**Negative / accepted costs**

- Seasonal tables grow across seasons until archived. Affordable at this scale;
  monitored, and the archival job exists when it stops being affordable.
- Every seasonal query must filter by `season_id`. Mitigated by scoping it in
  the repository layer so feature code does not repeat it.
- The catalog test needs maintaining as tables are added — but that is precisely
  the point at which someone might add the forbidden foreign key, so the test
  fires when it should.

**Neutral**

- Determining which tables are "seasonal" is a judgement call made per table at
  Prompt 3, guided by the Workbase §15 lists.

## References

- [`ARCHITECTURE.md §6.6`](../architecture/ARCHITECTURE.md#66-permanent-versus-seasonal-data)
- [`ARCHITECTURE.md §15.6`](../architecture/ARCHITECTURE.md#156-content-assets-and-seasons)
- Workbase §15, §19, §22, §24; Prompt 27, Prompt 30
