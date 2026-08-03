# Accessibility and readability

**Status:** Proposed — awaiting design approval

**Target: WCAG 2.2 Level AA.** Built with each feature, not audited on later —
`AGENTS.md` §4.

Every requirement here is written so it can be checked. "Accessible" is not a
review comment; each line below either passes or does not.

---

## 1. Contrast

| Content | Minimum | Where verified |
|---|---:|---|
| Body text | 4.5:1 | `VISUAL-LANGUAGE.md` §2.6 — computed, lowest is 4.63:1 |
| Large text — ≥1.5rem, or ≥1.25rem bold | 3:1 | Same table |
| UI boundaries, icons, focus ring | 3:1 | `border-interactive` 3.65:1; `focus` 8.97:1 |
| Decorative borders | none | `border-subtle`, `border-strong` — **never the sole marker of a control** |

Four colours were changed during Prompt 4 to reach these numbers. Any new colour
gets the same treatment: compute the ratio, correct the value, then use it.

---

## 2. Keyboard

- **Everything actionable is reachable and operable by keyboard.** No pointer-only
  interaction anywhere.
- **Focus is always visible** — 2px solid `focus`, 2px offset. `outline: none`
  without an equal replacement is a defect.
- **Tab order follows reading order.** No positive `tabindex`.
- Confirmation panels: focus moves in on open, returns to the trigger on close,
  and `Esc` cancels.
- **No keyboard trap**, anywhere, including the future replay controls.
- Skip link to the main content region, first in the tab order.

---

## 3. Meaning never rests on colour

The four domain accents in `VISUAL-LANGUAGE.md` §2.3 each carry a **shape cue and
a text label** as well as a hue.

| Signal | Colour | Non-colour carrier |
|---|---|---|
| Complete | `success` | ■ glyph **and** the word "Complete" |
| Under construction | `accent-settlement` | ▨ glyph, progress bar, time remaining |
| Not built | `text-muted` | □ glyph **and** the cost |
| Needs attention | `warning` | ⚠ glyph **and** the reason in words |
| Loss, damage, error | `danger` | Label **and** the number |

**Test:** render the interface in greyscale. Every state must still be
identifiable. If it is not, the state needs a non-colour carrier, not a
different colour.

---

## 4. Screen readers

- **Semantic HTML first.** `<button>` for actions, `<a>` for navigation,
  `<table>` for tabular data, real headings in order — no skipped levels.
- ARIA only where semantics cannot express it: `aria-busy` while loading,
  `aria-current="page"` on the active nav item, `aria-live="polite"` for
  completions and `assertive` for errors.
- **Every icon-only control has an accessible name.** There are very few of
  these by design.
- **Progress bars are `<progress>` or `role="progressbar"`** with `aria-valuenow`
  and a text equivalent — "4 minutes left" — not a bare bar.
- Decorative imagery, including the settlement illustration, is
  `alt=""`/`aria-hidden`. **Its information is in the building list**, which is
  why the list is never merely a caption for the picture.

---

## 5. Motion

- **`prefers-reduced-motion: reduce` removes all non-essential motion.**
  Transitions become instant; progress updates without tweening.
- Nothing animates on load.
- **Nothing flashes.** No content flashes more than three times per second, ever.
- The future PixiJS replay must honour reduced motion, offer pause and speed, and
  **degrade to the written report**. A player who cannot watch the replay loses
  no information — `COMPONENTS-AND-STATES.md` §3.

---

## 6. Readability

- **Body text is 1rem and never below 0.75rem** at any viewport.
- **200% zoom without horizontal scrolling.** Layout reflows to one column; only
  a wide element scrolls, inside its own container.
- **Measure of 60–75 characters** for prose. The battle report's "what decided
  it" is prose and obeys this.
- **Numbers are monospace with tabular figures** so quantities align in a column
  and do not shift width as a timer counts down.
- Line height at least 1.5 for body text.
- **No text in images.** Building names are text over the illustration, not
  painted into it — required for translation and for zoom.

---

## 7. Targets and input

- **Minimum 44 × 44px** hit target, on every viewport including desktop.
- At least `space-2` (0.5rem) between adjacent targets.
- **No hover-only information.** Anything revealed on hover is also available on
  focus and on touch.
- No drag-only interaction, and no gesture without a button equivalent.

---

## 8. Language and orientation

- `<html lang="en">`; copy written so it can be extracted for translation later.
- **Both orientations supported.** Never locked to portrait.
- Layout does not assume a viewport wider than 320px.

---

## 9. What Prompt 5 must check

Not aspirations — the list a reviewer runs.

| Check | How |
|---|---|
| Contrast holds in the built UI | Browser dev tools against `VISUAL-LANGUAGE.md` §2.6 |
| Every action reachable by keyboard | Tab through each screen; nothing skipped, nothing trapped |
| Focus visible everywhere | Same pass — look for a missing ring |
| Greyscale legibility | Render in greyscale; every state still identifiable |
| Reduced motion honoured | Set the OS preference; confirm motion stops |
| 200% zoom | Zoom; confirm reflow and no horizontal page scroll |
| Headings in order | Outline each page; no skipped level |
| Targets ≥ 44px | Inspect the smallest control on mobile |
| Automated sweep | axe or equivalent, zero critical issues |

**Automated tooling catches perhaps a third of this.** The keyboard pass and the
greyscale pass are manual and are the ones that find real defects.
