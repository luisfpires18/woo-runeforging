# Cost model and controls

Budget: **Azure for Students — $100 credit for twelve months**, plus a set of
always-free services.

> **Every figure here is an order-of-magnitude estimate.** Azure pricing varies
> by region and changes over time. **Re-verify with the Azure pricing calculator
> for the chosen region at Prompt 29**, before anything is provisioned. Nothing
> in this document is a quoted price.

> **Current spend: $0.** Nothing is deployed. Prompts 1–28 are entirely local.

---

## 1. The single most effective control

**Do not deploy anything until Prompt 29.**

Prompts 1 through 28 — architecture, platform bootstrap, domain contracts,
simulation tooling, the entire mocked and real Foundations of Iron loop, all of
First Flame, and hardening — run on Docker Compose with no cloud account
involved. Local development requires no Azure and no paid service, by design.

The credit stays whole for the test that actually needs it.

---

## 2. Estimated monthly cost during a closed test

| Resource | Configuration | Estimate/month |
|---|---|---:|
| PostgreSQL Flexible Server | Burstable **B1ms**, 32 GiB, single zone, no HA, 7-day backups | **$13–15** |
| Storage Account | Standard LRS Hot, assets + content, low volume | **$2–4** |
| Container Apps — API | 0.25 vCPU / 0.5 GiB, `minReplicas` 1 during test windows | **$0–3** |
| Container Apps — worker job | Scheduled, ~54,000 vCPU-s/month | **$0** (inside free grant) |
| Container Apps — migrate job | Manual, seconds per run | **$0** |
| Container registry | ghcr.io | **$0** |
| Log Analytics | Daily cap, 30-day retention | **$0** (inside free ingest) |
| Application Insights | Workspace-based, sampled, capped | **$0** |
| | **Total** | **≈ $18–22** |

**Runway: roughly four to five test months** on the $100 credit — more if
PostgreSQL is stopped between sessions (§4).

---

## 3. The Container Apps free grant

Consumption plan, per subscription per month:

| Resource | Free grant |
|---|---:|
| vCPU-seconds | **180,000** |
| GiB-seconds | **360,000** |
| Requests | **2,000,000** |

Charges apply only beyond these. **Jobs incur no charge when not executing**, and
apps scaled to zero incur nothing.

### Why the worker is a scheduled job, not an always-on app

| Shape | vCPU-s/month at 0.25 vCPU | Inside the grant? |
|---|---:|---|
| Always-on replica | ~648,000 | **No** — 3.6× over |
| **Scheduled job, `*/2` cron, ~10 s drain** | **~54,000** | **Yes**, with headroom |

This is the largest avoidable cost in the naive design, and it is avoidable only
because of a decision made much earlier: **resource production is elapsed-time
accrual, not ticks**. Due jobs exist solely for discrete completions —
construction, crafting, training, travel, battles — so job volume tracks player
decisions, not player count multiplied by time.

A one-to-two minute completion latency is invisible in an asynchronous strategy
game, and a returning player sees correct balances immediately regardless of
when the worker last ran.

**Request volume:** twenty players at a ten-second poll is roughly 2 requests per
second ≈ 5.2 million/month — above the 2 million free requests. Most return
`304 Not Modified` with no body, and the server-computed `nextPollAfterSeconds`
hint slows the cadence when nothing is pending, which cuts this substantially.
Watch it during the test rather than assuming it.

---

## 4. Controls in force

| Control | Effect |
|---|---|
| **No deployment before Prompt 29** | Credit untouched through all development |
| Worker as a scheduled job | Stays inside the free grant |
| Elapsed-time accrual, not ticks | Job volume independent of player count |
| API `minReplicas` 0 outside test windows | No idle compute charge |
| **Stop PostgreSQL between sessions** (up to 7 days) | Removes the largest line item during quiet periods |
| ghcr.io instead of ACR Basic | −$5/month |
| Log Analytics daily cap, 30-day retention | A logging bug cannot eat the credit |
| Application Insights sampling and cap | Same |
| Single zone, no HA, no read replica, no geo-backup | Smallest managed footprint |
| Managed identity instead of Key Vault | One less resource, no secret rotation cost |
| API serves the SPA | No second hosting service, no CDN bill |
| Content-addressed immutable assets | Maximum cache hits, minimum egress |

### Banned without explicit approval

Azure Front Door · API Management · Azure SignalR Service · Azure Cache for
Redis · AKS · Service Bus · Premium storage · Zone-redundant anything ·
Read replicas · Geo-redundant backup

No premium service enters by accident. Each would need an ADR and the product
owner's approval.

---

## 5. Budgets and alerts

Configure **before** the first resource is created. **[not yet runnable]**

```bash
# Monthly guardrail
az consumption budget create \
  --budget-name woo-monthly --amount 10 --time-grain Monthly \
  --category Cost --resource-group rg-woo-dominion-test

# Lifetime guardrail against the credit
az consumption budget create \
  --budget-name woo-total --amount 80 --time-grain Annually \
  --category Cost --resource-group rg-woo-dominion-test
```

| Threshold | Action |
|---|---|
| **50 %** | Note it. Check nothing unexpected is running |
| **80 %** | Investigate. Stop PostgreSQL outside test windows; check the Log Analytics cap |
| **100 %** | Stop non-essential resources. Consider teardown (§7) |

An alert must reach a human. Configure the email at creation; an unnoticed alert
is not a control.

---

## 6. Where money actually goes wrong

Ordered by likelihood, from experience with this shape of deployment:

| Risk | Symptom | Prevention |
|---|---|---|
| **Log volume explosion** | Log Analytics ingest climbing | Daily cap set at creation. A retry loop logging per attempt is the usual culprit |
| **PostgreSQL left running** | Steady spend with nobody playing | The stop command is in the runbook. **Note: a stopped server auto-restarts after 7 days** — put a reminder on it |
| **API `minReplicas` left at 1** | Small constant charge | Part of the post-session checklist |
| **A job scheduled too aggressively** | Container Apps charges beyond the grant | The cadence table in the runbook |
| **Orphaned restore servers** | A duplicate database billing quietly | Delete restored servers after a drill. Name them with a date so they are obvious |
| **Storage growth from replays** | Slow storage increase | Event logs are small; monitor rather than pre-optimise |

---

## 7. Teardown

Returns cloud spend to zero. **Irreversible.** **[not yet runnable]**

```bash
# Take a final backup first if the data matters — see RESTORE.md
az group delete --name rg-woo-dominion-test --yes --no-wait
```

Local development is unaffected — it needs no Azure resource at all.

---

## 8. If the credit runs out

The architecture is portable by construction. The applications are plain OCI
containers and **the only Azure-specific code in the solution is one
`IObjectStore` adapter**.

| Target | What changes | Rough cost |
|---|---|---:|
| **A single VPS with Docker Compose** | Connection strings; Azurite or MinIO for blobs; manual TLS, backups and patching | $5–10/month |
| Another container platform (Fly.io, Railway, Render) | Deployment manifests only | Varies |
| Back to fully local | Nothing — Compose is already the development environment | $0 |

Portability is preserved deliberately so this stays a real option rather than an
aspiration. See [ADR-0010](../adr/0010-environments-delivery-and-cost.md), where
the VPS alternative is recorded as genuinely competitive and rejected only
because the credit is available.

---

## See also

- [`RUNBOOK.md`](RUNBOOK.md) — start/stop procedures and the cadence knob
- [`RESTORE.md`](RESTORE.md) — what the backup choices cost in recovery terms
- [`../architecture/ARCHITECTURE.md §13`](../architecture/ARCHITECTURE.md#13-azure-deployment-topology)
