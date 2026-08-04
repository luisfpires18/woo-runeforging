# Visual language

**Status:** Proposed — awaiting design approval
**Implements:** Prompt 4
**Consumed by:** Prompt 5 onward

Arkazia's look, and every token Prompt 5 needs to build it. Values are literal
so nothing is transcribed by guess.

---

## 1. Direction

> **Blackened steel, crimson cloth, riveted plate, fortress stonework,
> forge-smoke militarism.** — `project_sources/arkazia.md`

The interface is a **dark, warm, metallic** space lit by forge light. Not the
cold blue-black of science fiction and not the parchment of a strategy board —
soot and iron with fire in it.

**Three rules that keep it grounded:**

1. **Medieval first.** Surfaces read as stone, iron and worked timber. No glow
   that is not fire, no gradient that is not smoke.
2. **Warmth is earned.** The base is nearly monochrome. Colour appears where
   something is happening — a forge burning, a company ready, a wall rising.
   A screen where nothing is in progress is almost grey, and that is correct.
3. **Restraint now buys escalation later.** Aura, runes and Chaos are years of
   fiction away. If the outpost already glows, there is nothing left to escalate
   to. Workbase §2: L1 is remarkable, L2 is a regional legend — the ordinary
   must look ordinary for that to land.

**Single dark theme.** No light mode. One committed look costs half the tokens
and half the contrast work, and matches the canon's own description. Revisit if
playtesters ask for it.

---

## 2. Colour

### 2.1 Surfaces

Warm near-blacks. Elevation is a step lighter, never a shadow alone.

| Token | Value | Use |
|---|---|---|
| `surface-0` | `#12100E` | Page background |
| `surface-1` | `#1A1815` | Panel, header, nav |
| `surface-2` | `#241F1B` | Card, raised region |
| `surface-3` | `#2E2823` | Hover, active row, elevated overlay |

### 2.2 Text and lines

| Token | Value | Use |
|---|---|---|
| `text-primary` | `#F0EAE2` | Body and headings |
| `text-secondary` | `#B9AFA3` | Supporting text, labels |
| `text-muted` | `#9A9083` | Timestamps, hints, disabled |
| `border-subtle` | `#3A332C` | Decorative separation only |
| `border-strong` | `#554A3E` | Card and panel edges |
| `border-interactive` | `#8C7D6C` | **Any border that identifies a control** |

`border-subtle` and `border-strong` are decorative and sit below 3:1
deliberately. **They may never be the only thing marking a control** — that is
what `border-interactive` is for.

### 2.3 Domain accents

Four domains, four accents. Acceptance asks that settlement growth, forging,
army readiness and consequence look distinct.

| Domain | Token | Value | Non-colour cue |
|---|---|---|---|
| Settlement growth | `accent-settlement` | `#8FA4B8` | Masonry block motif; scaffold hatching while building |
| Forging | `accent-forge` | `#E8974A` | Heat glow; anvil silhouette |
| Army readiness | `accent-army` | `#E97A6F` | Kite shield and banner shapes |
| Consequence | `accent-consequence` | `#DE8880` | Ledger rules; tabular alignment |

**Colour is never the only carrier of meaning.** Each domain also has its shape
cue and always its written label. This is an accessibility requirement
(`ACCESSIBILITY.md` §3), and it is also why the four accents are allowed to sit
near each other in hue without becoming ambiguous.

> **Note on the army accent.** Canon says Arkazian *crimson cloth*, and crimson
> at its true darkness (`#C0392F`) fails contrast on every surface here — 3.50
> at best, 2.68 at worst. The token is the lightened tint that survives on dark
> ground. Deep crimson stays available for **illustration and heraldry**, where
> it is not carrying text.

### 2.4 Reserved

| Token | Value | Use |
|---|---|---|
| `accent-sylvara` | `#8CAE79` | **Reserved for future Sylvaran content.** Unused today |

Sylvara's canon identity is bark, heartwood and leaf. The green is set aside so
that whatever Sylvaran content arrives inherits a consistent accent, and so no
Arkazian chrome accidentally claims it. **This document assigns Sylvara no role,
relationship or disposition** — none of the sources this package works from
establishes one.

### 2.4a Arkazian structure — added by the polish pass

Stone, steel and timber. **Surfaces and edges, never text**, so they sit below
3:1 deliberately; anything that must be read uses the text tokens.

| Token | Value | Use |
|---|---|---|
| `stone-dark` | `#2A2724` | Slate roofs, recessed bands |
| `stone` | `#343029` | Panel and header ground |
| `stone-lit` | `#3E3831` | Masonry face |
| `steel` | `#4A4239` | Panel edges, rails, dividers |
| `steel-lit` | `#5C5248` | Lit edge on a raised surface |
| `timber` | `#4A3A2C` | Beams, scaffolding, palisade |

### 2.4b The Arkazian action

The first pass used an amber fill, which read as generic software. The action is
now **crimson cloth over blackened steel, rimmed in forge light**.

| Token | Value | Contrast |
|---|---|---|
| `action-bg` | `#8E2A24` | — |
| `action-fg` | `#F0EAE2` | **7.01:1** on the fill — passes AA |
| `action-bg-hover` | `#A03028` | 5.96:1 with the same text |
| `action-rim` | `#E8974A` | **8.10:1** on `surface-0` |
| `crimson-deep` | `#8E2A24` | Illustration and heraldry, where it carries no text |

**The rim is structural, not decoration.** Deep crimson is only 2.27:1 against
the page, which would fail the 3:1 boundary rule for a control's edge. The forge
light carries that boundary — and it is also exactly the canon image of
blackened steel taken out of the fire.

### 2.5 Feedback

| Token | Value | Use |
|---|---|---|
| `focus` | `#F5C542` | Focus ring. **Never used decoratively** |
| `success` | `#7FB87A` | Completion confirmed |
| `warning` | `#E0AE52` | Needs attention, not yet failing |
| `danger` | `#E4756A` | Destructive action, error, loss |
| `on-accent` | `#12100E` | Text on a filled accent button |

### 2.6 Contrast — computed, not estimated

Every ratio below was calculated against the WCAG 2.2 relative-luminance
formula. **Minimum across all four surfaces**, so a token is safe wherever it
lands.

| Token | s0 | s1 | s2 | s3 | Min | AA |
|---|---:|---:|---:|---:|---:|---|
| `text-primary` | 15.89 | 14.82 | 13.66 | 12.17 | **12.17** | Pass |
| `text-secondary` | 8.79 | 8.20 | 7.56 | 6.73 | **6.73** | Pass |
| `text-muted` | 6.05 | 5.64 | 5.20 | 4.63 | **4.63** | Pass |
| `accent-settlement` | 7.39 | 6.89 | 6.35 | 5.66 | **5.66** | Pass |
| `accent-forge` | 8.10 | 7.56 | 6.96 | 6.20 | **6.20** | Pass |
| `accent-army` | 6.76 | 6.31 | 5.81 | 5.18 | **5.18** | Pass |
| `accent-consequence` | 7.18 | 6.70 | 6.17 | 5.50 | **5.50** | Pass |
| `accent-sylvara` | 7.63 | 7.12 | 6.56 | 5.85 | **5.85** | Pass |
| `focus` | 11.70 | 10.92 | 10.06 | 8.97 | **8.97** | Pass |
| `success` | 8.17 | 7.63 | 7.02 | 6.26 | **6.26** | Pass |
| `warning` | 9.35 | 8.73 | 8.04 | 7.16 | **7.16** | Pass |
| `danger` | 6.37 | 5.95 | 5.48 | 4.88 | **4.88** | Pass |
| `border-interactive` | 4.76 | 4.44 | 4.09 | 3.65 | **3.65** | Pass (3:1 UI) |

`on-accent` `#12100E` on `accent-forge` 8.10, on `accent-army` 6.76, on `focus`
11.70 — all pass.

**Four colours were changed to get here.** The first palette failed: army
crimson at 3.50/2.68, muted text at 3.75, danger at 3.77, the interactive border
at 2.86. They were corrected in this document rather than shipped and discovered
in an audit.

---

## 3. Typography

System stack — no web font. A font file is a network request, a licence and a
loading state, and none of it improves a low-fidelity slice.

```
font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
font-family-numeric: ui-monospace, "Cascadia Mono", Menlo, monospace;
```

**Numbers use the monospace stack** wherever they are compared or accumulate —
resource balances, costs, casualty counts, durations. Digits that shift width
while a timer ticks are the single most restless thing an idle screen can do.

| Token | Size | Line height | Weight | Use |
|---|---|---|---|---|
| `text-display` | 1.75rem | 1.2 | 600 | Screen title |
| `text-heading` | 1.25rem | 1.3 | 600 | Panel heading |
| `text-subheading` | 1rem | 1.4 | 600 | Group label |
| `text-body` | 1rem | 1.5 | 400 | Default |
| `text-small` | 0.875rem | 1.45 | 400 | Supporting |
| `text-caption` | 0.75rem | 1.4 | 500 | Timestamps, units |
| `text-numeric` | inherits | 1.4 | 500 | Quantities — monospace, tabular figures |

**Minimum 0.75rem.** Nothing smaller, at any viewport. Body text must survive
200% zoom without a horizontal scrollbar.

### 3.1 The display treatment — added by the second visual pass

The system stack stands. A game screen still needs a voice for the settlement and
the settlement that a data table does not have, and it is built from weight,
scale and tracking rather than from a second typeface.

| Token | Value | Use |
|---|---|---|
| `text-display-lg` | 2.75rem | The settlement name. Heavy, tight, one line |
| `tracking-display` | -0.02em | Names — set tight, so the word reads as a mass |
| `tracking-label` | 0.18em | Screen and region labels — set wide, small, and never bold enough to compete |
| `tracking-wide` | 0.09em | Status words, units, nav |

**Two registers, and only two.** A *name* is large, heavy and tightly tracked.
A *label* is small, uppercase and widely tracked. Nothing sits between them, so
a heading never has to be read twice to know which kind of thing it is.

The settlement name is a label, not a title: it is stamped above the title
the way a name is stamped into steel. A screen label is followed by a hairline
of `steel` capped in `action-rim` — a lit edge, drawn in CSS, not an image.

> **Why not a display font.** The three reasons in §3 have not changed: a font
> file is a network request, a licence and a loading state. A real one belongs
> with the art pass that replaces the placeholder illustration, not before it.

---

## 4. Spacing

A 4px base. Only these steps.

| Token | Value |
|---|---|
| `space-1` | 0.25rem |
| `space-2` | 0.5rem |
| `space-3` | 0.75rem |
| `space-4` | 1rem |
| `space-5` | 1.25rem |
| `space-6` | 1.5rem |
| `space-8` | 2rem |
| `space-12` | 3rem |

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 2px | Inputs, chips |
| `radius-md` | 4px | Cards, buttons |
| `radius-lg` | 8px | Overlays |

**Radii stay small.** Rounded corners read as modern software; near-square reads
as stone and iron.

| Token | Value |
|---|---|
| `content-max` | 90rem |
| `mobile-breakpoint` | 48rem |

> `content-max` was raised from 72rem by the visual-polish pass — at 1440px the
> old value left dead bands down both sides of a screen whose whole subject is a
> place. `NAVIGATION.md` §2 carries the same figure.
>
> `space-5` was added by the second visual pass. It was already being *used* by
> four rules in `app.css` while not existing in `tokens.css`, which made each of
> those declarations invalid at computed-value time: panels rendered with no
> padding, buttons with no side padding, and the building grid with no gap.

---

## 5. Surfaces and elevation

| Level | Surface | Border | Use |
|---|---|---|---|
| Base | `surface-0` | — | Page |
| Raised | `surface-1` | `border-subtle` | Header, nav, sidebar |
| Card | `surface-2` | `border-strong` | Building card, report block |
| Overlay | `surface-3` | `border-strong` | Dialog, menu |

Shadows are a **single soft ambient shadow** on overlays only:
`0 4px 16px rgba(0,0,0,0.5)`. Elevation is carried by surface value, not by a
shadow stack — stone does not float.

---

## 6. Icons

- **Line icons, 1.5px stroke, 24px grid.** 20px and 16px variants keep the same
  stroke, so weight stays even next to text.
- **Silhouette over detail.** An icon must be legible at 16px on a dark surface.
- **Every icon has a text label or an accessible name.** No icon-only control
  without one.
- **Never emoji.** Workbase §2 — emoji are not game art and not interface art.

Domain shape cues, which double as the non-colour carrier from §2.3:

| Domain | Shape |
|---|---|
| Settlement | Masonry block |
| Construction | Scaffold hatching |
| Forge | Anvil |
| Army | Kite shield |
| Consequence | Ledger rule |
| Resources | One glyph per resource — coin, grain, log, block, ore chunk, crate |

---

## 7. Interaction and motion

| Token | Value | Use |
|---|---|---|
| `duration-instant` | 80ms | Hover, focus |
| `duration-fast` | 160ms | Panel, disclosure |
| `duration-slow` | 320ms | Screen transition |
| `easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default |

**Rules**

- **Nothing animates on load.** A returning player reads their report; they do
  not watch it assemble.
- **Progress moves, nothing else.** A construction bar advances. Idle interface
  is still.
- **`prefers-reduced-motion: reduce` removes all non-essential motion** —
  transitions become instant, progress bars update without tweening. This is not
  optional, and it matters more later: the PixiJS battle replay (§9) must honour
  it too.
- Focus ring: **2px solid `focus`, 2px offset**, never removed, never
  `outline: none` without an equal replacement.
- Minimum hit target **44 × 44px**, including on desktop.

---

## 8. Settlement illustration

Rewritten by the second visual pass. What was a note for a later art brief is
now the structure the screens are built on, and the constraints below are the
ones the placeholder art already honours — a real art pass replaces the files,
not the rules.

### 8.1 The scene is separate from the sites

**One authored panorama, and seven site plots laid over it at fixed anchors.**
The panorama holds terrain, fortification and light. No building is drawn into
it. The anchors are a single map from `BuildingKind` to a percentage position
(`web/src/components/SettlementScene.tsx`), so a site stands in the same place
on every screen that shows the outpost, and raising one does not mean reissuing
the whole picture.

This is what makes the site "visibly evolve" without a combinatorial asset set:
the world is one file, and growth is carried by the plots on top of it.

### 8.2 Value structure

**The world is lighter than the plots.** Site plates are dark stone with a lit
steel rim; if the ground behind them is drawn at the same value they read as
holes rather than as objects standing on it. The scene therefore works in the
stone range (`stone-dark` through `steel-lit`).

**The skyline is the exception.** The far range is nearly black against a low
warm band near the horizon — the only light in the picture. Everything in front
of that band reads as cut out of the sky, which is what gives a flat vector
drawing depth without a single blur or glow.

### 8.3 States

**Each site needs four states:** not built, under construction, complete,
damaged. Damage arrives with battle consequences and is not drawn yet.

State is carried **structurally**, not by a second file per state:

| State | Frame | Art | Also |
|---|---|---|---|
| Not built | Steel, solid | Full | Glyph `□`, word "Not built" |
| Under construction | Steel, `accent-settlement` base rule | Scaffold hatching overlaid | Glyph `▨`, word, `<progress>`, minutes left |
| Complete | Steel, `success` base rule | Full | Glyph `■`, word, what it yields |
| Previewed | **Dashed**, `border-strong` | Reduced and desaturated | Glyph `□`, word "Not yet available", the requirement |

Four cues per state — frame language, art treatment, glyph and word — so the
set survives greyscale and survives a player who cannot distinguish the hues.

### 8.4 Standing constraints

- **Stage variants** beyond Outpost are later, but the panorama leaves ground
  unbuilt on both flanks so a settlement can grow outward into it.
- **Fallback chain terminates.** Every asset falls back to a faction placeholder
  and finally a heraldic token. Missing art can never block play. The faction
  placeholder is drawn at full site scale and depicts surveyed, pegged-out
  ground — a fallback is still a picture of somewhere.
- Art ships with the application until the library outgrows it — ADR-0014.
- **Never emoji. Never runtime-generated art.**

---

## 9. Battle replay — notes for later

PixiJS enters at Prompt 7. Constraints that the visual language sets now:

- **The replay renders the event log and calculates nothing.** If a number is
  shown, it was in the log. If the renderer needs a value that is not there, the
  fix is to emit it — never to compute it client-side.
- **Representative sprites, not every soldier.** A company is shown by a
  handful of figures and a banner.
- **Aura and rune effects do not exist yet** and must not be prototyped.
- Must honour `prefers-reduced-motion`, offer pause, speed and a timeline, and
  **degrade to the written report** if the renderer or an asset is unavailable.
- The palette above is the replay's palette. Fire uses `accent-forge`; the
  player's own force uses `accent-army`.
