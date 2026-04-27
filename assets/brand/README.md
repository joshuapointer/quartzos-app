# Quartzie Brand Kit

Production-ready brand assets for the Quartzie app — the companion app for the Dab Rite PRO v2.2.

## Asset inventory

| File | Size | Purpose |
|---|---|---|
| `monogram.png` | 1024×1024 | Primary monogram on warm-obsidian. Use for press, profile avatars, square brand placements. |
| `monogram-512.png` | 512×512 | Smaller export of the same monogram for blog avatars / app stores. |
| `wordmark-light.png` | 1200×320 | Full wordmark on warm-obsidian. Use on dark backgrounds. |
| `wordmark-dark.png` | 1200×320 | Wordmark on warm-bone. Use on light backgrounds. |
| `og-hero.png` | 1200×630 | Open-graph share image. Monogram + wordmark + tagline + descriptor. |
| `social-square.png` | 1080×1080 | Instagram / general social square. Centered monogram + wordmark stack. |

Vector source files live alongside in `source/`:
- `monogram.svg`, `icon.svg`, `adaptive-icon.svg`, `splash-icon.svg`, `wordmark-light.svg`, `wordmark-dark.svg`, `og-hero.svg`, `social-square.svg`, `grain.svg`.

The renderer used to produce the PNGs is `@resvg/resvg-js`. The same SVGs can be re-rendered at any size; see `/tmp/svg2png/render.js` for the pipeline.

## Where the app icons live

The four runtime app icons (referenced from `app.json`) live in `assets/`:

| File | Use |
|---|---|
| `assets/icon.png` (1024×1024) | iOS app icon master |
| `assets/adaptive-icon.png` (1024×1024) | Android adaptive icon foreground (mark sized within 66% safe-zone) |
| `assets/splash-icon.png` (1024×1024) | Splash screen mark — wordmark over an ember halo |
| `assets/favicon.png` (512×512) | Web favicon |

The Android adaptive-icon background color is `#050403` (warm void-obsidian), set in `app.json` under `android.adaptiveIcon.backgroundColor`. The splash background color is also `#050403`, under `splash.backgroundColor`.

## Brand mark — design rationale

The Quartzie monogram is the **Q-as-thermal-dial**:

- The bowl of the Q is the TempDial outer ring at fired-amber (#E89240) — the "at-target" heat state.
- The descender is the heat-trace tangent leaving the ring at ~4 o'clock, ending in a small ember terminal.
- The center lens is a warm-obsidian gradient (`lensTarget` → `surface1`) that reads as the inner crystal at temperature.
- A subtle bone gloss runs across the upper edge of the lens — the only specular highlight on the mark.
- A hairline bone tick at 12 o'clock anchors the dial.

The mark literally **is** what the app does: a temperature dial that spells Q. Premium without announcing itself.

## Brand colors (hex anchors)

| Role | Hex | Notes |
|---|---|---|
| void-obsidian | `#050403` | Deepest background. Never pure black. |
| surface1 | `#0c0908` | Card / lens base |
| surface3 | `#1c1714` | Mid surface |
| fired-amber | `#E89240` | At-target heat ring, brand accent |
| ember-glow | `#C97326` | Heating ring, gradient mid |
| ember-deep | `#8A4E16` | Deep heat, gradient tail |
| cold-slate | `#9ABDD8` | Dunk-ready / cooled |
| brass | `#C4AC54` | Custom preset accent gem |
| warm-bone | `#f4ede4` | Primary text |
| bone-mid | `#c7b8a4` | Secondary text |
| bone-dim | `#9e907e` | Tertiary text |

Full palette and rules in `/DESIGN.md`.

## Typography

- **Wordmark:** Georgia italic (`quartzie`). Wordmark-only register; never used in UI text.
- **UI:** Space Grotesk (Light 300 / Regular 400 / Medium 500 / Bold 700).
- **Tagline (uppercase):** `RITUAL  INSTRUMENT` — letterSpacing 6, weight 500, bone-dim.

## Usage rules

1. The wordmark may always sit on `#050403` (light variant) or `#f4ede4` (dark variant). Do not place it on amber.
2. The monogram has built-in ember halo — do not add additional outer glow.
3. Minimum monogram size: 64×64 px (anything smaller becomes a flat amber dot).
4. Clear-space: at least 12.5% of the monogram width on every side.
5. Never tint the wordmark amber. Amber is a temperature signal, not a brand color (per the Functional Color Rule).

## Re-generating PNGs

```bash
cd /tmp/svg2png
node render.js   # renders all targets defined in render.js
```

To add a new target, edit the `targets` array in `render.js` with `{ svg, out, w }`.
