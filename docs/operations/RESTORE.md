# Backup and restore

> **A restore procedure that has never been executed is a hope, not a
> capability.** Prompt 28 requires this drill to be **run**, and its result
> recorded, before the closed test begins.

> **Nothing is deployed yet.** Commands marked **[not yet runnable]** depend on
> infrastructure that does not exist. The procedure is specified now so it
> exists before it is needed.

---

## 1. What is backed up, and what does not need to be

| Data | Mechanism | Why |
|---|---|---|
| **PostgreSQL** | Azure Flexible Server automated backups, **7-day retention**, geo-redundancy off | The only irreplaceable state: Houses, settlements, ledgers, weapons, runes, history |
| **Assets** | **None required** | Content-addressed and reproducible from the repository. A lost blob is restored by re-uploading from a checkout |
| **Content bundles** | **None required** | Baked into container images and pinned by tag |
| **Application code and infrastructure** | git + ghcr.io | Rebuildable from any commit |
| **Secrets** | Managed identity — **no database password exists in the happy path** | Nothing to lose or rotate for PostgreSQL and Blob access |

This is why the backup surface is small: exactly one thing carries irreplaceable
state.

## 2. Recovery objectives

| Objective | Target | Meaning |
|---|---|---|
| **RPO** | ≤ 24 hours | Up to a day of play could be lost in the worst case |
| **RTO** | ≤ 4 hours | Time to a working system after a decision to restore |

**These are closed-test objectives**, stated plainly so nobody assumes
production-grade continuity. They are appropriate for roughly twenty testers and
are deliberately modest — meeting tighter numbers would mean geo-redundant
backups and standby capacity that the student credit should not fund.

Point-in-time restore within the 7-day window gives finer granularity than the
RPO promises in practice; the RPO is the commitment, not the capability.

---

## 3. The restore drill

Run against a **restored copy**, never against the live server. The drill is
also the real procedure — practising it is running it.

### Step 1 — Restore to a new server **[not yet runnable]**

```bash
az postgres flexible-server restore \
  --name pg-woo-dominion-restore-$(date +%Y%m%d%H%M) \
  --resource-group rg-woo-dominion-test \
  --source-server pg-woo-dominion-test \
  --restore-time "2026-08-01T14:30:00Z"
```

Never restore over the source. A restore into a new server keeps the original
available while the copy is verified.

### Step 2 — Verify schema and migration state **[not yet runnable]**

```sql
SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId" DESC LIMIT 5;
SELECT nspname FROM pg_namespace
 WHERE nspname IN ('core','economy','forge','military','world','app');
```

All six schemas present, and the migration history matching the application
version being restored to.

### Step 3 — Ledger reconciliation **[not yet runnable]**

The decisive check. If the economy does not reconcile, the restore is not
usable.

```sql
SELECT b.house_id, b.resource, b.amount AS balance,
       COALESCE(SUM(l.delta), 0) AS ledger_total,
       b.amount - COALESCE(SUM(l.delta), 0) AS drift
  FROM economy.balance b
  LEFT JOIN economy.ledger_entry l
    ON l.house_id = b.house_id AND l.resource = b.resource
 GROUP BY b.house_id, b.resource, b.amount
HAVING b.amount <> COALESCE(SUM(l.delta), 0);
```

**Zero rows required.** Any row means the restore captured a torn state — stop
and restore to a different point in time.

### Step 4 — Permanent-state counts **[not yet runnable]**

```sql
SELECT 'houses'        AS entity, count(*) FROM core.house
UNION ALL SELECT 'settlements',   count(*) FROM core.settlement
UNION ALL SELECT 'named_items',   count(*) FROM forge.named_item
UNION ALL SELECT 'rune_instances',count(*) FROM forge.rune_instance
UNION ALL SELECT 'history',       count(*) FROM world.history;
```

Compare against the last operator report. Small deltas are expected — the
restore point precedes the incident. **A large drop means the wrong restore
point.**

### Step 5 — Singular-object uniqueness **[not yet runnable]**

A restore must not resurrect a second copy of something that must be unique.

```sql
SELECT rune_definition_id, count(*)
  FROM forge.rune_instance
 WHERE destructibility = 'Singular'
 GROUP BY rune_definition_id
HAVING count(*) > 1;
```

**Zero rows required.**

### Step 6 — Job and outbox sanity **[not yet runnable]**

```sql
SELECT state, count(*) FROM app.due_job GROUP BY state;
SELECT count(*) FROM app.outbox WHERE dispatched_at_utc IS NULL;
```

Leased jobs from the dead server will show stale `lease_owner` values. This is
**expected and self-correcting** — the claim predicate reclaims expired leases
automatically, and handlers are idempotent, so re-execution is safe.

Undispatched outbox rows will be dispatched on the next worker run.

### Step 7 — Cut over **[not yet runnable]**

1. Set API `minReplicas` to 0 to stop accepting commands.
2. Point the connection configuration at the restored server.
3. Run `caj-woo-migrate` if the restore predates the current schema.
4. Start the API; confirm `/healthz/ready`.
5. Re-run the reconciliation query against the live system.
6. Record the outcome in the operator report.

### Step 8 — Record the drill

| Field | Value |
|---|---|
| Date executed | |
| Restore point requested | |
| Wall-clock time to step 7 | |
| Reconciliation drift | |
| Singular-object duplicates | |
| Deviations from this procedure | |
| Fixes needed to this document | |

**A drill that finds nothing wrong and takes longer than the RTO has still
failed.** Record the time honestly.

---

## 4. Local development

Development never depends on restore. A broken local database is rebuilt:

**[not yet runnable]**

```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d db blob
dotnet run --project tools/Woo.Seed -- --reset
```

To capture an interesting playtest state:

```bash
docker compose exec db pg_dump -U woo -Fc woo > snapshots/interesting-state.dump
docker compose exec -T db pg_restore -U woo -d woo --clean < snapshots/interesting-state.dump
```

Snapshots are local artefacts. `snapshots/` is not committed.

---

## 5. What this design deliberately does not provide

| Not provided | Why | Would need |
|---|---|---|
| High availability | No standby; a zone failure means downtime | Zone-redundant HA — roughly doubles database cost |
| Geo-redundant backup | Regional loss means data loss | Geo-redundant backup storage |
| Sub-hour RTO | Restore is manual | Standby capacity and automated failover |
| Backups beyond 7 days | Retention is the minimum | Longer retention, at cost |

Each is a deliberate trade against the student credit, revisited if the product
leaves closed testing. **None of them should be assumed to exist.**

---

## See also

- [`RUNBOOK.md`](RUNBOOK.md) — daily operations and triage
- [`COST.md`](COST.md) — what these choices cost
- [ADR-0010](../adr/0010-environments-delivery-and-cost.md)
