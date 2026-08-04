# ADR-0016 — Settlement terminology

**Status:** Accepted
**Date:** 4 August 2026

## Context

The application called the player's domain a **House**: a `House` aggregate
owning one `Settlement`, a `HouseState` contract, a `HouseStateProvider`, a
"House Seat" screen, a "House Hall" building, and a placeholder House named
"House Karrow" holding an outpost named "Ashen Reach".

The product owner judged that vocabulary too close to *A Song of Ice and Fire*
to carry the game's own identity, and asked for plain settlement terminology
with no replacement proper noun.

Two things made this cheaper than it looked:

- **"House" is not canon.** `project_sources/` — the twelve files that
  `AGENTS.md` §1 places above the architecture and the code — contains **zero
  occurrences of the word**. It appears only in the Workbase (42) and the
  implementation prompt sheet (30), which are the creator's working documents.
- **The House and the Settlement were always one thing.** A House owned exactly
  one Settlement and nothing else, and the glossary already recorded "one
  settlement per House — no village spam" as a rule to enforce.

## Decision

**The player's domain is a Settlement.** `House` and `Settlement` merge into a
single `Settlement` aggregate carrying its name, kingdom, stage, buildings and
resource pool. `Settlement.Id` remains the aggregate identity.

| From | To |
|---|---|
| `House` | `Settlement` |
| `Houses` | `Settlements` |
| `House Karrow` | `Arkazian Outpost` |
| House Seat | Outpost |
| `HouseHall` / "House Hall" | `CommandHall` / "Command Hall" |
| House history | History |
| The household | Residents |

**The settlement has no proper name.** It is an Arkazian outpost, described by
what it is. "Ashen Reach" is retired along with "House Karrow": inventing a
second proper noun to replace the first would have missed the point, and naming
the place is the player's to do later.

**The Workbase, the prompt sheet and `project_sources/` are not edited.** They
are source documents, and `AGENTS.md` §6 already forbids editing canon to fit
the code. Later prompt text saying "House" means the Settlement; the glossary
records that mapping so nobody has to guess. Existing ADR bodies are likewise
left as written — this ADR supersedes none of them.

**Outpost, Village, Town and City are recorded as possible future settlement
stages and nothing more.** No progression is implemented; `SettlementStage`
keeps its single member. Fort, Castle and Capital describe strategic roles, not
tiers, and are not introduced.

## Alternatives

**Rename `House` to something else invented — Bannerhold, Holdfast, a Seat.**
Rejected: it replaces one borrowed proper noun with another, and the product
owner asked specifically not to. It would also have kept the two-type structure
whose only rule was that the second type could never have more than one row.

**Rename `House` to `Settlement` and give the existing `Settlement` a new name
— `Site`, `Holding`.** Rejected: it preserves a distinction the model does not
have. One player, one settlement, and after the merge that is the shape of the
type rather than an invariant to police.

**Leave the domain alone and change only player-facing copy.** Rejected: the
`HouseState` contract, the provider, the ESLint-fenced seam and the test names
are all read far more often than the strings are, and a codebase whose types
disagree with its screens teaches everyone who joins it to distrust both.

## Consequences

- **A data migration, not just a rename.** `MergeHouseIntoSettlement` moves
  `Kingdom` onto `Settlements`, re-points `ResourceBalances` from `HouseId` to
  `SettlementId`, rebuilds that table's primary and foreign keys, and drops
  `Houses` last. `Buildings` already keyed on `SettlementId` and needed no
  change — but `Buildings.Kind` is stored as a string, so the `HouseHall` to
  `CommandHall` rename had to move the stored values too.
- **`Down` is lossy in exactly one place**: the settlement's original name.
  Everything else round-trips, and an integration test proves both directions
  against a populated database migrated from `InitialHouseAggregate`.
- **The seam kept its shape.** Only names changed —
  `SettlementState`, `SettlementStateSource`, `SettlementStateProvider`,
  `useSettlementState` — so ADR-0015's boundary and its ESLint rule are
  untouched.
- **Routes are unchanged.** `/` and `/settlement` still address the same two
  screens; moving them would have cost link stability for no product gain.
- **Prompt text will read oddly from here on.** Prompts 7 through 32 say
  "House". `docs/domain/GLOSSARY.md` carries the mapping, and this decision is
  the reason to prefer the code's word over the prompt's.
