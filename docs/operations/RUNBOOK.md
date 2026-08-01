# Operator runbook

Procedures for running the system locally and, from Prompt 29, in Azure.

> **Nothing in this repository is deployed.** The Azure sections describe the
> design that Prompt 29 will execute **with explicit authorization**. Commands
> marked **[not yet runnable]** depend on code or infrastructure that does not
> exist.

---

## 1. Local development

### 1.1 Prerequisites

| Tool | Version | Check |
|---|---|---|
| .NET SDK | 10.0.200 | `dotnet --list-sdks` |
| Node.js | 24 LTS | `node --version` |
| Docker Desktop | 28+ with Compose v2.40+ | `docker compose version` |

The SDK is pinned in `global.json`; Node in `.nvmrc`.

### 1.2 Full stack **[not yet runnable]**

```bash
docker compose -f docker/docker-compose.yml up
```

Brings up `db`, `blob` (Azurite), `migrate` (one-shot), `api`, `worker`, `web`.
Use for clean-checkout verification, CI parity and onboarding.

### 1.3 Host mode — the daily loop **[not yet runnable]**

```bash
docker compose -f docker/docker-compose.yml up db blob
dotnet run --project src/Woo.Api
dotnet run --project src/Woo.Worker
cd web && npm run dev
```

Dependencies in containers, application code in the IDE. Hot reload and
breakpoints.

### 1.4 Reset to a known world **[not yet runnable]**

```bash
dotnet run --project tools/Woo.Seed -- --reset
```

Drops game data, re-applies migrations, seeds the deterministic demo world.
Seconds, not minutes — development never depends on a restore.

### 1.5 Nuke local state

```bash
docker compose -f docker/docker-compose.yml down -v
```

Removes containers **and volumes**. The database is gone. Follow with §1.2 and
§1.4.

---

## 2. Migrations

### 2.1 Rules

- **Never auto-migrate on API start in production.** The migrator is a separate
  entrypoint, run before a new API revision activates.
- **Expand → migrate → contract** for breaking changes, so a rolling revision
  never meets a schema it cannot read:
  1. *Expand* — add the new column or table, nullable, deployed and live.
  2. *Migrate* — backfill via a due job, never inside the migration.
  3. *Contract* — drop the old shape only once no running revision reads it.
- **Review every migration for lock duration.** A migration that rewrites a
  large table blocks writes.
- **Forward-fix over rollback.** `Down()` is retained for development
  convenience only; do not rely on it against real data.

### 2.2 Apply locally **[not yet runnable]**

```bash
dotnet ef database update --project src/Woo.Infrastructure --startup-project src/Woo.Api
```

### 2.3 Apply in Azure **[not yet runnable]**

```bash
az containerapp job start --name caj-woo-migrate --resource-group rg-woo-dominion-test
az containerapp job execution list --name caj-woo-migrate --resource-group rg-woo-dominion-test -o table
```

Confirm success **before** activating the new API revision.

---

## 3. Worker cadence and cost

The worker runs as a scheduled Container Apps Job. The cron expression is the
main cost and latency knob.

| Cron | Executions/day | Approx. vCPU-s/month at 0.25 vCPU, ~10 s drain | Worst-case latency |
|---|---:|---:|---|
| `*/1 * * * *` | 1440 | ~108,000 | 1 min |
| **`*/2 * * * *`** (default) | **720** | **~54,000** | **2 min** |
| `*/5 * * * *` | 288 | ~21,600 | 5 min |

The Consumption free grant is **180,000 vCPU-seconds/month**. All three fit; the
default balances responsiveness against headroom for the API.

Change it: **[not yet runnable]**

```bash
az containerapp job update --name caj-woo-worker --resource-group rg-woo-dominion-test \
  --cron-expression "*/5 * * * *"
```

Completion latency is largely invisible because resource production is
elapsed-time accrual, not ticks — a returning player sees correct balances
immediately regardless of when the worker last ran.

---

## 4. Test-window toggles

Scale the API up before a session and down after.

**Before a test session** — avoid cold starts: **[not yet runnable]**

```bash
az containerapp update --name ca-woo-api --resource-group rg-woo-dominion-test --min-replicas 1
az postgres flexible-server start --name pg-woo-dominion-test --resource-group rg-woo-dominion-test
```

**After a test session** — stop the largest cost line: **[not yet runnable]**

```bash
az containerapp update --name ca-woo-api --resource-group rg-woo-dominion-test --min-replicas 0
az postgres flexible-server stop --name pg-woo-dominion-test --resource-group rg-woo-dominion-test
```

> **A stopped Flexible Server restarts automatically after 7 days.** Stop it
> again, or accept the running cost. Put a calendar reminder on it.

---

## 5. Health and triage

| Endpoint | Meaning |
|---|---|
| `/healthz/live` | Process responsive. **Zero dependencies** — a database blip must never restart the container |
| `/healthz/ready` | PostgreSQL reachable · migrations applied · all live-referenced content versions loaded · blob reachable |

The worker has no HTTP surface. It writes a heartbeat row and emits a last-run
metric; **absence of a recent heartbeat is the alert**.

### 5.1 Symptom table

| Symptom | Check first | Likely cause |
|---|---|---|
| Completions are late | `woo.jobs.overdue_seconds`, worker heartbeat | Worker not running, cron too slow, or jobs failing and backing off |
| `woo.jobs.queue_depth` climbing | `woo.jobs.retries`, `last_error` on pending rows | A handler is failing repeatedly |
| Jobs in `poison` | `last_error`, correlation ID in logs | Bug in a handler, or bad data. **Do not blind-retry** — diagnose, fix, then requeue |
| `woo.ledger.reconciliation_drift` non-zero | **Stop and investigate.** §6 | A balance changed without a ledger entry, or a duplicated effect |
| `woo.outbox.lag_seconds` climbing | Worker running? Handler failing? | Post-commit reactions falling behind. Game state is still correct |
| Readiness fails after deploy | Startup logs | Most often a **missing live-referenced content bundle** — see §7 |
| `412` responses to clients | Expected under concurrent edits | Optimistic concurrency working. Investigate only if constant |

### 5.2 Follow one action end to end

Every log entry carries `CorrelationId`, `HouseId` and `Module`, and the ID
flows request → command → outbox → job → battle → history.

```
CorrelationId = <id>
```

That query reconstructs the whole chain. Ask a player for the ID shown in their
error toast.

---

## 6. Economy reconciliation

The single most important operational check. **A non-zero drift means the
economy is wrong**, and every hour it runs makes it harder to unpick.

**[not yet runnable]**

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

Zero rows is correct. Any row is an incident:

1. **Do not correct the balance by hand.** Find the cause first — a hand
   correction destroys the evidence.
2. Identify the affected House and resource, and the window from ledger
   timestamps.
3. Look for a duplicated effect (an idempotency key that should have been
   present) or a write path that skipped its ledger entry.
4. Correct **through an audited domain or ledger operation** with a reason and
   an actor, never a raw `UPDATE`. Prompt 28 requires admin corrections to be
   audited operations.

---

## 7. Content versions

Readiness fails at startup if a **live-referenced** content version's bundle is
missing from the image. That is deliberate — it refuses a deploy that would
orphan in-flight work rather than letting a player discover it later.

**[not yet runnable]**

```sql
SELECT version, published_at_utc, bundle_present
  FROM app.content_version_registry
 ORDER BY published_at_utc DESC;
```

If readiness fails: identify the missing version, restore its bundle to the
image, redeploy. **Do not delete the referencing rows.**

Before retiring a version, run the liveness query and confirm nothing still
holds it.

---

## 8. Deployment **[not yet runnable — requires explicit authorization]**

> **Never deploy, push, publish, purchase services or rotate credentials without
> explicit authorization from the product owner.** The pipeline enforces this:
> `deploy.yml` is `workflow_dispatch` only and gated by a GitHub Environment
> approval.

Order of operations:

1. `validate.yml` green on the commit.
2. `publish.yml` has pushed images to ghcr.io tagged with the SHA.
3. Run `caj-woo-migrate`. **Confirm success.**
4. Update the API revision to the new image.
5. Smoke-test `/healthz/ready`.
6. Watch `woo.jobs.queue_depth` and `woo.outbox.lag_seconds` for a few cadence
   intervals.

**Rollback:** revert the API revision to the previous SHA. If the deploy
included a migration, the expand/migrate/contract discipline means the previous
revision still reads the current schema — which is the entire reason for that
discipline.

---

## 9. Pausing a closed test

The test must be pausable **without destroying permanent state** (Prompt 29
acceptance).

1. Announce the pause to participants.
2. Set API `minReplicas` to 0 — the API stops accepting commands.
3. Let the worker drain: watch `woo.jobs.queue_depth` reach zero.
4. Run the reconciliation query in §6 and record the result.
5. Stop the PostgreSQL server.

Resuming reverses the order. Permanent state is untouched: settlements,
specialists, forge mastery, named weapons and history are all in permanent
tables with no foreign key to anything seasonal.

---

## 10. Teardown

Removes every Azure resource and all cloud cost. **Irreversible.**

**[not yet runnable]**

```bash
# Take a final backup first if the data matters — see RESTORE.md
az group delete --name rg-woo-dominion-test --yes --no-wait
```

Local development is unaffected; it requires no Azure resource.

---

## See also

- [`RESTORE.md`](RESTORE.md) — backup and the restore drill
- [`COST.md`](COST.md) — cost model, budgets and alerts
- [`../architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) — the design these procedures operate
