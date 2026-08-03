# Foundations of Iron — design package

**Status:** Proposed — **awaiting design approval**
**Produced by:** Prompt 4
**Consumed by:** Prompt 5 onward

The design of the first playable experience, written **before** its screens are
built. It exists so Prompt 5 can implement the House Seat without making a
single product decision of its own.

**This package is documents only.** No component, no CSS, no change to `web/`.

---

## Contents

| Document | Answers |
|---|---|
| [`JOURNEYS.md`](JOURNEYS.md) | What happens in a first session and a returning one; the three session lengths |
| [`NAVIGATION.md`](NAVIGATION.md) | What the areas are and how the player moves between them, on both viewports |
| [`WIREFRAMES.md`](WIREFRAMES.md) | Six screens, desktop and mobile, with copy |
| [`VISUAL-LANGUAGE.md`](VISUAL-LANGUAGE.md) | How it looks; every token, with computed contrast; notes for later art and replay |
| [`COMPONENTS-AND-STATES.md`](COMPONENTS-AND-STATES.md) | What to build; the six states; where a primary action belongs |
| [`ACCESSIBILITY.md`](ACCESSIBILITY.md) | The requirements, and the checks Prompt 5 must pass |

---

## The five principles

**1 — One decision at a time.**
A session is *review → choose → prepare → commit → resolve*. Every screen serves
one step of it. The first session makes exactly one decision, understood.

**2 — Nothing is committed before its cost is visible.**
Cost, duration, what remains afterwards, and whether it can be undone — all shown
before the confirm, never after.

**3 — Medieval before magic.**
Soot, iron and stone, lit by forge light. Runes are the long-term centre and are
**not a visible system here**. If the outpost already glows, there is nothing
left to escalate to.

**4 — Absence is never punished.**
Nothing decays, nothing expires unclaimed. A long absence produces a longer
change list, and the copy never manufactures urgency the game does not have.

**5 — Colour is never the only carrier of meaning.**
Every state has a glyph and a word as well as a hue. The test is greyscale.

---

## The first useful action

**Raise the Lumber Yard**, presented on the first-session House Seat as the
single filled button.

**This is a starter-balance and playtest hypothesis, not canon.** The reasoning
is mechanical: the Lumber Yard is the cheapest building and timber appears in
every other building's cost, so it is the first move least likely to strand a new
player.

Nothing in `project_sources/` establishes Arkazia as timber-poor —
`arkazia.md` lists **alpine forests** alongside its iron-rich slopes. What canon
does say is that **Sylvara** is rich in lumber, herbs and game. Any framing of
timber as an Arkazian weakness would be invention, and this package does not make
it.

The proposed opening order — Lumber Yard → Storehouse → House Hall, then Quarry
or Mine — is a hypothesis for the **Prompt 8 playtest** to confirm or overturn.
The property worth protecting is not the order: it is that **every building is
individually affordable while all five together are not**, which is what makes
the first session a decision rather than a checklist.

---

## What this package deliberately does not decide

- **Balance numbers.** Costs and durations shown in the wireframes are the
  starter content, marked as placeholders throughout.
- **Sylvara's role.** `accent-sylvara` is reserved for future Sylvaran content
  and used nowhere. No relationship, trade or disposition is assigned, because
  none of the sources this package works from establishes one.
- **Illustration.** `VISUAL-LANGUAGE.md` §8 records the constraints the eventual
  art brief inherits; it does not commission art.
- **Replay implementation.** §9 sets the constraints; PixiJS enters at Prompt 7.

---

## Handoff contract for Prompt 5

Prompt 5 builds the mocked House Seat and outpost onboarding over typed fake
data. From this package it takes:

| Needs | Source |
|---|---|
| Screen layout and copy | `WIREFRAMES.md` §1–§5 |
| Exact colours, type, spacing, motion | `VISUAL-LANGUAGE.md` §2–§7 — literal values |
| What to build, and its rules | `COMPONENTS-AND-STATES.md` §1 |
| Loading, empty, error, unavailable, success, offline | `COMPONENTS-AND-STATES.md` §2–§3 |
| Where a primary action belongs, and where none does | `COMPONENTS-AND-STATES.md` §4 |
| Navigation on both viewports | `NAVIGATION.md` §2–§3 |
| Accessibility checks to pass | `ACCESSIBILITY.md` §9 |

**Prompt 5 creates `tokens.css`** from `VISUAL-LANGUAGE.md`. This package leaves
no code behind, because it ends at "stop for design approval" and nothing should
presume approval.

**If Prompt 5 finds a gap, that is a defect in this package.** Raise it and fix
it here rather than inventing an answer in a component — a decision made in
passing inside a component is a decision nobody reviewed.

### Screens for systems that do not exist

Forge, Army and Battle report are designed here but were not built by Prompt 3
and are not built by Prompt 5. That is intended: Prompt 4 designs the whole first
experience, and Prompts 6–7 mock those parts in turn. **Navigation shows only
what exists** — an area that has not arrived is absent, never a disabled tab.

---

## Approval

The acceptance criteria for Prompt 4:

| Criterion | Where it is answered |
|---|---|
| The first useful action is obvious | Above; `WIREFRAMES.md` §1 |
| Settlement growth, forging, army readiness and consequence have distinct visual identities | `VISUAL-LANGUAGE.md` §2.3 — four accents, each with a non-colour cue |
| Mobile preserves all essential decisions | `NAVIGATION.md` §3 — the two-tap rule; a mobile wireframe per screen |
| Specific enough for Prompt 5 without inventing the product design | Literal token values; a wireframe per screen; copy per state |

**This package is an argument, not a result.** Nothing in it is proven until a
person reads the screens and a tester plays them. The Prompt 8 gate exists to
find out — automated tests cannot tell anyone whether the loop is enjoyable.
