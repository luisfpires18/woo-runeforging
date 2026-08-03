# ADR-0014 — Local development, CI and what is not delivered

**Status:** Accepted
**Date:** 3 August 2026
**Supersedes:** [ADR-0007](0007-content-and-assets.md),
[ADR-0010](0010-environments-delivery-and-cost.md)

---

## Context

ADR-0010 specified a full delivery story before there was anything to deliver:
an Azure Container Apps environment, a PostgreSQL Flexible Server, a storage
account, Log Analytics, Application Insights, Bicep modules with `dev` and
`test` parameter files, ghcr.io image publishing, budgets with alerts at
50/80/100 %, and a documented backup and restore procedure. ADR-0007 added
versioned JSON content with JSON Schema validation, reference-driven content
version retention, an asset manifest with terminating fallback chains, and
Azurite as the local object store.

The owner has Azure for Students, but deployment comes **after** a locally
playable slice exists, and Prompt 2 forbids Azure resources, Bicep, deployment
workflows and image publishing outright. Operations documentation for
infrastructure that does not exist is documentation that will be wrong by the
time it is used.

## Decision

**Docker Compose for PostgreSQL only, GitHub Actions for build, test, lint and
type-check, and nothing else.**

1. **Compose runs one service: `db`.** The API and the web client run on the
   host, keeping hot reload and breakpoints. No `api`, `worker`, `web`,
   `migrate` or `blob` service.
2. **Host port 5433, not 5432.** A machine with a native PostgreSQL service
   installed already owns 5432, and that listener silently shadows the Docker
   mapping — producing an authentication failure against the wrong server, which
   is exactly what happened during this prompt's validation. `POSTGRES_PORT`
   overrides it.
3. **CI is `validate.yml` with three jobs.** `backend` runs
   `dotnet format --verify-no-changes`, `build -c Release` and `test` against a
   `postgres:18-alpine` **service container**; `frontend` runs `npm ci`, `lint`,
   `typecheck`, `build`; `docs` runs the two documentation scripts.
4. **No deployment workflow, no image publishing, no infrastructure code.**
5. **Local development requires no Azure and no paid service**, and that is a
   standing constraint rather than a current convenience.
6. **Authored content and assets are deferred.** Art ships with the application
   when there is art. The content schema, version registry and asset manifest
   arrive when there is content to validate (Prompt 3 onward).
7. **`docs/operations/` is deleted.** `RUNBOOK.md`, `RESTORE.md` and `COST.md`
   described procedures for infrastructure that will not exist for many prompts.
   They return at Prompts 28–29, written against what is actually deployed.

## Alternatives considered

**Keep the ops documents, trimmed.** Rejected: a runbook for a system nobody can
run is not a reduced-value document, it is a misleading one. Deleting it is
honest, and the reasoning survives in the superseded ADR-0010.

**Testcontainers instead of a CI service container.** Rejected: it adds a test
dependency and makes every `dotnet test` invocation require a Docker daemon. A
service container is fifteen lines of YAML and the developer already runs
Compose.

**No database in CI at all.** Rejected: "PostgreSQL connectivity works" would
then be a claim rather than a fact, and a broken connection string would reach
`master` silently.

**Add gitleaks as a secret-scanning gate.** Deferred: Prompt 2's stated CI scope
is build, tests, lint and type-check. Worth adding, but not by widening scope
inside this prompt.

**.NET Aspire for local orchestration.** Rejected for now: Compose is the
portable artefact and maps onto any container host. Aspire's dashboard can be
added later as a purely local convenience without changing the deployed shape.

## Consequences

- A clean checkout needs Docker, the .NET 10 SDK and Node 22. Nothing else.
- CI proves the same commands a developer runs, so a green pipeline means the
  documented workflow works.
- There is no backup or restore procedure, because there is no data worth
  restoring. This must be revisited **before** the first environment holds
  anyone's progress.
- Cost is zero. The Azure credit is untouched.

**Revisit when:** a local playable slice exists and the owner authorises
deployment (Prompts 28–29). At that point the Azure topology, budgets, backup
and restore, and the operations documents are written against the real system.
