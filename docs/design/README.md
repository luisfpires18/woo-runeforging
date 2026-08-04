# Foundations of Iron — design package

**Status:** **Approved** and built against — see the amendments at the foot
**Produced by:** Prompt 4 (`f084304`)
**Consumed by:** Prompt 5 onward

The design of the first playable experience, written **before** its screens are
built. It exists so Prompt 5 can implement the House Seat without making a
single product decision of its own.

**Prompt 4 delivered documents only** — no component, no CSS, no change to
`web/`. Prompt 5 built from them, and where it found a gap the fix landed here
rather than inside a component.

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

## Amended by Prompt 5

Building the mock surfaced three places where the prompt sequence asked for more
than this package had designed. All three were resolved with the product owner
and are recorded here rather than left as drift:

| Gap | Resolution |
|---|---|
| Prompt 5 names **barracks and forge**; this package drew five buildings | **Seven.** Barracks and Forge appear as previews with their requirement stated. `WIREFRAMES.md` carries the amendment |
| Prompt 5 asks the player to **meet a named smith** | A household card on the House Seat. Fake data; he is idle until a forge exists |
| Prompt 5 asks to **assign or confirm basic production** | **Confirm** — a completed production site states what it yields, read-only. No workforce model was invented |

Two further changes came out of looking at the built screens:

- **The site row wraps rather than scrolls.** Seven plots do not fit across a
  1280px viewport, and a clipped final plot reads as broken rather than
  scrollable.
- **The resource bar keeps its labels on mobile.** The package said it
  "collapses to values"; implemented literally with `display: none`, that
  removed the names from the accessibility tree as well as the screen, leaving
  everyone with a row of bare numbers. It now wraps to two lines instead.

## The visual-polish pass (3 August 2026)

The first build of Prompt 5 was functional but read as an internal dashboard.
A focused pass re-grounded the presentation in Arkazia without touching the
information architecture, routes, scenarios, provider boundary or accessibility
rules.

| Change | Why |
|---|---|
| **Arkazian action style** replaces the amber CTA | Crimson cloth over blackened steel, rimmed in forge light. `VISUAL-LANGUAGE.md` §2.4b, with the contrast working |
| **Stone, steel and timber structure tokens** | Panels, rails and headers read as fortress stonework rather than flat cards. §2.4a |
| **A ridge backdrop** behind the shell | Depth, so the page is a place rather than a black rectangle. Decorative, `aria-hidden`, never information |
| **The sidebar joins the shell** | A stone rail with a shared edge, not a detached list |
| **The resource strip is its own band** | Six even cells with rules between them; labels wrap on mobile rather than being dropped |
| **An authored building set** on one visual grammar | Shared ridge, ground line and palette, so the site reads as one place seen in parts. `web/src/assets/README.md` |
| **Building states are visually distinct** | Complete, under construction, not built, and previewed each differ in border, opacity and overlay — on top of the glyph and word they already carried |
| **Content width raised to 90rem** | The old 72rem left large dead bands at 1440px |
| **"What changed" and "Needs attention" lead the page** | They are the returning player's first two questions, not sidebar material |

Two defects were found only by looking at the running app, not by any test:

- **Building art silently stopped rendering.** Vite inlined the SVGs as an empty
  `data:image/svg+xml,` — the files are valid, but they carry `#` in every
  colour and a `url(#…)` gradient reference. Assets are no longer inlined.
- **Mobile clipped "Workshop Supplies" and "See all options."** Both now wrap or
  stack.

## The second visual pass (4 August 2026)

The polish pass fixed the palette but not the shape: every piece of information
still sat in an equally styled rectangle, and the artwork was icon-scale. The
screen read as a dashboard with a good colour scheme rather than as a game.

This pass recomposes it around the outpost itself. **Information architecture,
routes, scenarios, the provider boundary, mocked behaviour and every
accessibility rule are unchanged.**

| Change | Why |
|---|---|
| **A settlement scene is the page** | `ashen-reach.svg` fills the frame and the seven sites stand on their own ground inside it. The subject of the screen is a place, so the place should be the screen. `VISUAL-LANGUAGE.md` §8.1 |
| **Three levels, and only three** | World, command surface, record. A thing at one level is never dressed like a thing at another — which is why `.panel` is gone as a universal wrapper |
| **One integrated HUD** | House identity, settlement state and the stores answer one question and share one stone band, instead of stacking two |
| **The rail is welded to the HUD** | Shared edge, no gap, cloth tab for the current area. It reads as part of the frame rather than a list beside it |
| **A command ledge, not a card** | The objective is stated on a ledge joined to the bottom edge of the world, tied to the site it is about. The settlement screen uses the same ledge for the selected site |
| **Site plots replace building rows** | An illustrated plate with a nameplate, standing where the building would stand — not a row in a list |
| **Selecting a site is local and visual** | It changes which site the ledge describes. Nothing is committed, nothing is saved, and there is no start control, because starting construction is Prompt 6 |
| **Architectural vignettes replace symbols** | Each of the six drawn sites has its own silhouette, terrain, foundation and working detail. The shared ridge path that made them look tiled is gone. `web/src/assets/README.md` |
| **A display treatment, still on the system stack** | Names set heavy and tight, labels set small and wide. Two registers, no third, and no font file. `VISUAL-LANGUAGE.md` §3.1 |
| **Mobile is composed, not collapsed** | Scene banner, then the ledge, then the sites — so the current decision is never below seven plots |

Three defects found the same way as last time, by looking:

- **`--space-5` did not exist.** Four rules in `app.css` used it anyway, so each
  was invalid at computed-value time — panels had no padding, buttons no side
  padding, the building grid no gap. The token is now defined; `VISUAL-LANGUAGE.md`
  §4 records it.
- **The panorama shipped invisible.** An SVG comment containing `----` is an XML
  parse error, and the browser stops rendering at that point without reporting
  it. The rule is now written down in the asset README.
- **The settlement screen scrolled horizontally at 375px.** A two-column title
  row gave the prose a 14px track. The title row wraps instead.

Reversed from the polish pass:

- **"What changed" and "Needs attention" no longer lead the page.** They sit in
  the record band below the scene. The returning player's first question is
  answered higher up than before — by the site itself, where the Lumber Yard is
  visibly under construction — and the ledge states what is next.

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
