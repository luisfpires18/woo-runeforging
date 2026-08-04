# Artwork

Authored placeholder art for the Foundations of Iron mock. **Nothing here is
copied from another game, and no asset is fetched from a remote host** — every
file is hand-written SVG in this repository.

## The three scales

| Scale | File | Frame | Job |
|---|---|---|---|
| The world | `environment/outpost.svg` | `0 0 1600 700` | The settlement panorama. One place, seen whole |
| A site | `buildings/*.svg`, `factions/arkazia.svg` | `0 0 160 112` | One structure and the ground it stands on |
| The page | `environment/ridge.svg` | `0 0 1600 500` | Backdrop behind the whole shell, at low contrast |
| The settlement | `heraldry/arkazian-token.svg` | `0 0 64 76` | The settlement token, and the terminal fallback |

**No building is drawn into the panorama.** The seven sites are laid over it at
fixed anchors (`components/SettlementScene.tsx`), so the scene stays true as the
settlement changes and one large file does not have to be reissued every time a
plot is raised.

## The visual grammar

All site art shares one grammar so the set reads as a place rather than a pile
of icons:

| Layer | Tone | Meaning |
|---|---|---|
| Sky | `#1A1815 → #12100E` | Overcast mountain light |
| Ridge behind | `#221D19`, `#2A2521` | Varies per site — the slope that one actually sits on |
| Ground band | `#1A1815` | The near edge, shared by every site |
| Raw slope | `#312C26`, `#3A342D` | Ground the settlement has not worked |
| Worked stone | `#3E3831`, lit `#4A4239`, edge `#5C5248` | Arkazia builds in stone, and cut stone is the lighter thing |
| Slate roof | `#2A2724` | Blackened, low and heavy |
| Timber | `#4A3A2C`, lit `#5C4A38` | Beams, scaffolds, palisade, cart stock |
| Crimson | `#8E2A24` | Arkazian cloth — sparing, one banner or one rack at most |
| Forge light | `#E8974A` | Fire only. Never decoration |

Canon: *blackened steel, crimson cloth, riveted plate, fortress stonework,
forge-smoke militarism* — `project_sources/arkazia.md`.

**The ridge behind each site differs.** The first pass shared one byte-identical
ridge path across all seven files, which made the row read as tiling rather than
as one settlement seen in parts. Each site now sits under the slope its function
implies: the quarry against a cut mass, the mine against a steep close face, the
lumber yard where the ground falls away toward the forest.

**Every site is a vignette, not a symbol.** Each carries terrain, a foundation
and the working detail that says what happens there — a saw frame over its pit,
a derrick over dressed blocks, rails out of an adit, a rack of kite shields
inside a palisade. A silhouette alone is an icon; the job of these files is to
look like somewhere.

## Values, and why the world is lighter than the plots

The site plots are dark stone plates with a lit steel rim. If the panorama is
drawn at the same value they read as holes cut in black rather than as objects
standing on ground, so the scene works in the **stone** range and the plates sit
below it.

The skyline is the one exception: the far range is nearly black, silhouetted
against a low warm band. That band is the only light in the picture, and
everything in front of it should read as cut out of the sky.

## The fallback chain

```
buildings/<kind>.svg  →  factions/arkazia.svg  →  heraldry/arkazian-token.svg
```

The last link is guaranteed present, so missing art can never block play.

**`buildings/forge.svg` is deliberately absent.** It is how the missing-asset
state stays real and testable rather than theoretical, and a component test
asserts the fallback renders without throwing. Do not "fix" it by adding the
file.

Because the Forge is a preview on the settlement screen, `factions/arkazia.svg`
is what a player actually looks at there. It is drawn at full site scale and
shows exactly what the settlement has done on that ground: cleared the footing, driven
and braced the stakes, run the set-out lines, dropped the first stone. It is a
real answer to "what is there", not a graphic apologising for a missing file.

`people/*` is also absent: portraits are a later prompt, and a portrait falls
straight to the heraldic token rather than through the faction placeholder —
a picture of a fortress is not a picture of a person.

## Rules

- **No emoji, ever** — not as art, not as a fallback (Workbase §2).
- **No runtime-generated art.**
- **Never write `--` inside an SVG comment.** It is an XML parse error, and the
  browser silently stops rendering at that point rather than reporting it — the
  panorama shipped invisible once for exactly this reason.
- Construction state is an **overlay** — scaffolding drawn over the silhouette —
  not a second file per state. It keeps the set small and the states consistent.
- Keep `build.assetsInlineLimit: 0` in `vite.config.ts`. Every file here carries
  `#` in its colours and `url(#…)` gradient references, which Vite's
  non-base64 data-URI inliner does not survive.
- These are placeholders. A real art pass replaces them wholesale, and the
  fallback chain means it can happen one file at a time.
