---
name: Quartzie

colors:
  # ── Deep navy backdrop (matches QuartzOS marketing) ──
  navy-0: "#050a14"   # outermost — near-black blue
  navy-1: "#081224"   # main canvas
  navy-2: "#0c1a30"   # card base
  navy-3: "#122439"   # raised surface
  navy-4: "#1a3052"   # divider / hairline-on-card
  canvas-base: "#02050c"  # behind the body bloom stack

  # ── Bone / off-whites with cool blue tint (the "QuartzOS" wordmark color) ──
  bone-100: "#f4f6fa"
  bone-90:  "#e6ebf2"
  bone-70:  "oklch(0.78 0.012 240)"
  bone-50:  "oklch(0.62 0.012 240)"
  bone-35:  "oklch(0.45 0.012 240)"
  bone-20:  "oklch(0.30 0.010 240)"

  # ── Ember — the glowing-quartz amber. Warm hue ~45–55° ──
  ember-bright: "oklch(0.78 0.20 55)"
  ember:        "oklch(0.72 0.19 50)"
  ember-deep:   "oklch(0.58 0.17 45)"
  ember-glow:   "oklch(0.72 0.20 50 / 0.45)"
  ember-text:   "#fff5e8"  # near-white with warm cast, used on emissive surfaces

  # ── Quartz — cool blue accent (used sparingly, for cool/dunk cues) ──
  quartz-bright: "oklch(0.82 0.08 240)"
  quartz:        "oklch(0.72 0.07 240)"
  quartz-deep:   "oklch(0.55 0.06 245)"
  quartz-glow:   "oklch(0.72 0.10 240 / 0.30)"

  # ── Body bloom stack (atmospheric tint behind the canvas) ──
  bloom-warm-tl: "oklch(0.36 0.12 50 / 0.22)"   # top-left warm flare
  bloom-warm-br: "oklch(0.30 0.14 38 / 0.18)"   # bottom-right warm flare
  bloom-cool-bottom: "oklch(0.22 0.08 245 / 0.40)"
  bloom-cool-top:    "oklch(0.24 0.06 240 / 0.35)"

typography:
  display:
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "32px"      # scales: 26px (in-frame stage), 32px (CTA hero), up to 64px (marketing display)
    fontWeight: 300
    lineHeight: "32px"    # 1.0
    letterSpacing: "-0.035em"

  display-bold:           # the tight, bold sans treatment ("QuartzOS" wordmark)
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "19px"      # used by the in-app wordmark; scales freely
    fontWeight: 700
    lineHeight: "1.0"
    letterSpacing: "-0.025em"

  body-lg:
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "1.5"
    letterSpacing: "0"

  body-md:
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "1.5"
    letterSpacing: "0"

  label-action:           # pill button label
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "1.0"
    letterSpacing: "0.04em"

  metric:                 # large numerical readout (session/peak/window stats)
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: "1.0"
    letterSpacing: "-0.02em"

  numeral-orb:            # the dial's huge temperature digits
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "clamp(72px, 50% of orb size, 160px)"
    fontWeight: 300
    lineHeight: "0.88"
    letterSpacing: "-0.07em"
    fontVariantNumeric: "lining-nums tabular-nums"

  eyebrow:                # mono uppercase labels (STANDBY, AT TARGET, DEVICE NOT FOUND)
    fontFamily: "Geist Mono, SF Mono, ui-monospace, monospace"
    fontSize: "9.5px"     # range 9–11px depending on context
    fontWeight: 500
    lineHeight: "1.4"
    letterSpacing: "0.32em"
    textTransform: "uppercase"

  mono-data:              # tabular telemetry (timers, target windows, ranges)
    fontFamily: "Geist Mono, SF Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: "1.4"
    letterSpacing: "0.18em"
    fontVariantNumeric: "tabular-nums"

  frame-label:            # the "QUARTZIE · QUARTZ-OS DRIVEN" caption under the phone
    fontFamily: "Geist Mono, SF Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: "1.4"
    letterSpacing: "0.12em"
    textTransform: "uppercase"

rounded:
  none: "0"
  sm:   "6px"      # internal control corners (segmented thumb)
  md:   "8px"      # tab pill thumb
  lg:   "14px"     # tweaks panel
  xl:   "18px"     # session preset bar
  pill: "100px"    # all CTAs, status chips, tab bar — never less
  full: "9999px"   # circles (orb, app glyph, dot indicators)
  phone-frame: "54px"  # iPhone-style outer frame radius

spacing:
  unit: "4px"
  xs:   "4px"
  sm:   "8px"
  md:   "14px"     # standard control padding-y
  lg:   "22px"     # screen horizontal padding
  xl:   "32px"     # canvas page padding
  canvas-gap-x: "48px"   # gap between phone frames on the canvas (horizontal)
  canvas-gap-y: "56px"   # gap between phone frames on the canvas (vertical)
  frame-min:    "420px"  # minimum frame column width (auto-fit grid)
  canvas-max:   "1700px" # max canvas width
  phone-w:      "390px"
  phone-h:      "844px"
  status-bar:   "54px"   # top inset inside the phone frame

elevation:
  glass-disc:
    description: "Cool-tinted backdrop-blur surface — replaces rectangular cards"
    backdropFilter: "blur(22px) saturate(1.2)"
    background: "radial-gradient(circle at 30% 0%, rgba(255,255,255,0.05), transparent 55%), rgba(8,14,26,0.55)"
    boxShadow:
      - "inset 0 0.5px 0 rgba(255,255,255,0.10)"   # top light catch
      - "inset 0 -0.5px 0 rgba(0,0,0,0.55)"        # bottom shadow lip
      - "inset 0 0 0 0.5px rgba(180,200,230,0.08)" # hairline rim
      - "0 12px 32px rgba(0,0,0,0.45)"             # ambient drop

  glass-disc-warm:
    description: "Same disc, ember-tinted edge for active/heated contexts"
    backdropFilter: "blur(22px) saturate(1.3)"
    background: "radial-gradient(circle at 30% 0%, oklch(0.78 0.20 55 / 0.10), transparent 55%), rgba(14,10,8,0.55)"
    boxShadow:
      - "inset 0 0.5px 0 oklch(0.78 0.20 55 / 0.20)"
      - "inset 0 -0.5px 0 rgba(0,0,0,0.55)"
      - "inset 0 0 0 0.5px oklch(0.78 0.20 55 / 0.15)"
      - "0 12px 32px rgba(0,0,0,0.45)"
      - "0 0 24px oklch(0.62 0.20 50 / 0.08)"      # warm bleed into surroundings

  hairline:
    description: "Soft horizontal divider with a single highlight pixel"
    height: "0.5px"
    background: "linear-gradient(90deg, transparent, rgba(220,230,245,0.16), transparent)"
    boxShadow: "0 0.5px 0 rgba(0,0,0,0.4)"

  phone-frame:
    description: "iPhone-style multi-stop bezel layered on dark canvas"
    boxShadow:
      - "0 50px 100px rgba(0,0,0,0.55)"    # ambient drop
      - "0 0 0 1.5px #16243a"              # inner bezel
      - "0 0 0 2px rgba(0,0,0,0.85)"       # vacuum line
      - "0 0 0 8px #081224"                # outer bezel (navy-1)
      - "0 0 0 9.5px #1a3052"              # rim highlight (navy-4)

motion:
  duration:
    instant: "150ms"      # micro hover, segmented thumb slide
    quick:   "200ms"      # button transform
    base:    "400ms"      # color/opacity baselines
    smooth:  "600ms"      # ".q-smooth" transitions across stage changes
    enter:   "480ms"      # view-enter animation
    deliberate: "800ms"   # orb state crossfade (idle ↔ heating ↔ target)
    slow:    "900ms"      # ambient-bloom crossfade
  easing:
    swoop:   "cubic-bezier(0.22, 1, 0.36, 1)"   # primary — used for almost everything
    standard: "ease"
    in-out:  "ease-in-out"
  signature-animations:
    view-enter:    "480ms swoop — opacity 0→1, translateY(14px→0), scale(.985→1), blur(4px→0)"
    stagger-in:    "600ms swoop, 55ms cascade — opacity + translateY(12px→0)"
    fade-key:      "380ms swoop — opacity + translateY(4px→0) + blur(2px→0); for keyed text changes"
    pulse:         "700ms swoop — scale 0.94 → 1.04 → 1; for emphasis bursts"
    orb-breathe:   "7s ease-in-out infinite — scale 1 → 1.012 → 1; gives the orb life"
    orb-pulse:     "2.0–2.4s ease-in-out infinite — opacity 0.85 → 1 → 0.85 on the hot core"
    caustic-rotate: "22s linear infinite — slowly rotates light ribbons across the orb"
    estimated-breathe: "2.4s ease-in-out infinite — opacity 0.78 → 1 → 0.78 on stale/predicted readings"

components:
  q-action:
    description: "The signature emissive ember pill — the only fully-saturated CTA in the system"
    typography: "{typography.label-action}"
    rounded: "{rounded.pill}"
    padding: "14px 26px"
    color: "{colors.ember-text}"
    background:
      - "radial-gradient(120% 200% at 50% 0%, oklch(0.86 0.18 55 / 0.55), transparent 60%)"
      - "linear-gradient(180deg, oklch(0.62 0.20 50), oklch(0.42 0.16 42))"
    boxShadow:
      - "inset 0 0.5px 0 rgba(255,240,220,0.45)"          # top wet highlight
      - "inset 0 -0.5px 0 rgba(0,0,0,0.45)"               # bottom shadow lip
      - "inset 0 0 0 0.5px oklch(0.86 0.18 55 / 0.50)"    # warm inner rim
      - "0 0 0 0.5px rgba(0,0,0,0.40)"                    # outer cut
      - "0 8px 28px oklch(0.62 0.20 50 / 0.55)"           # warm cast shadow
      - "0 0 60px oklch(0.62 0.20 50 / 0.18)"             # outer bloom
    transition: "transform 200ms ease, box-shadow 300ms ease"
    hoverTransform: "translateY(-1px)"

  q-action-ghost:
    description: "Cool counterpart — same shape, glass-disc fill, no emission"
    typography: "{typography.label-action}"
    rounded: "{rounded.pill}"
    padding: "14px 26px"
    color: "{colors.bone-90}"
    background:
      - "radial-gradient(120% 200% at 50% 0%, rgba(220,230,245,0.10), transparent 60%)"
      - "rgba(8,14,26,0.55)"
    boxShadow:
      - "inset 0 0.5px 0 rgba(255,255,255,0.10)"
      - "inset 0 -0.5px 0 rgba(0,0,0,0.45)"
      - "inset 0 0 0 0.5px rgba(180,200,230,0.14)"
      - "0 8px 28px rgba(0,0,0,0.45)"

  status-chip:
    description: "Thin pill at the top of every screen — connection state"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
    color: "{colors.bone-50}"
    boxShadow: "inset 0 0 0 0.5px rgba(180,200,230,0.10)"
    statusDot:
      size: "5–6px"
      offline:   "{colors.bone-35}, no glow"
      connected: "{colors.ember-bright}, box-shadow: 0 0 8px ember-bright"

  tab-bar:
    description: "Floating glass pill anchored 28px from the bottom of the phone"
    rounded: "{rounded.pill}"
    padding: "4px"
    background: "rgba(12,26,48,0.72)"
    backdropFilter: "blur(20px) saturate(140%)"
    boxShadow:
      - "inset 0 0.5px 0 rgba(180,200,230,0.10)"
      - "inset 0 -0.5px 0 rgba(0,0,0,0.4)"
      - "0 8px 24px rgba(0,0,0,0.5)"
      - "0 0 0 0.5px rgba(180,200,230,0.08)"
    activeTab:
      background: "linear-gradient(180deg, oklch(0.28 0.04 240), oklch(0.18 0.03 240))"
      color: "{colors.bone-100}"
      boxShadow: "inset 0 0.5px 0 rgba(180,200,230,0.18), 0 1px 2px rgba(0,0,0,0.4)"
      fontWeight: 500
    idleTab:
      color: "{colors.bone-50}"
      fontWeight: 400

  preset-bar:
    description: "Inline panel summarising the active preset on the session screen"
    rounded: "{rounded.xl}"
    padding: "14px 18px"
    background: "linear-gradient(180deg, oklch(0.13 0.012 50), oklch(0.08 0.008 50))"
    boxShadow: "inset 0 0.5px 0 rgba(255,240,220,0.06), 0 1px 0 rgba(0,0,0,0.4)"

  progress-strip:
    description: "Thin step-progress bars at the top of multi-step builders"
    height: "3px"
    rounded: "2px"
    completed: "{colors.ember-bright}"
    current: "{colors.ember}, glow: 0 0 10px oklch(0.78 0.20 55 / 0.6)"
    pending: "rgba(180,200,230,0.10)"

  etched-text:
    description: "Type that reads as if projected onto the environment, not painted"
    cool:
      textShadow: "0 0 18px rgba(220,230,245,0.10), 0 1px 0 rgba(0,0,0,0.4)"
    warm:
      textShadow: "0 0 24px oklch(0.78 0.20 55 / 0.45), 0 0 48px oklch(0.62 0.20 50 / 0.18)"

  accent-amber:
    description: "Warm-glow accent for hero terms (e.g. 'Dab Rite' inside the headline)"
    color: "oklch(0.82 0.20 55)"
    fontWeight: 400
    textShadow: "0 0 28px oklch(0.78 0.20 55 / 0.55), 0 0 56px oklch(0.62 0.20 50 / 0.25)"

  orb:
    description: |
      The single most important component. A refractive quartz sphere assembled from
      ~7 stacked layers: ambient bloom, mid bloom, rotating caustics, hairline rim,
      multi-stop glass body, top refraction streak, lower refraction crescent,
      breathing hot core, etched progress arc, four cardinal tick marks, and a
      centered numeric readout. All colors below shift by `state`.
    sizeRange: "150–320px (responsive to current stage)"
    breathe: "scale 1 → 1.012 → 1 over 7s"
    states:
      idle:
        core: "oklch(0.32 0.06 240)"
        glow: "oklch(0.45 0.10 240 / 0.45)"
        ring: "oklch(0.55 0.04 240)"
        textColor: "{colors.bone-90}"
        eyebrow: "STANDBY"
      heating:
        core: "oklch(0.55 0.20 50)"
        glow: "oklch(0.62 0.22 50 / 0.85)"
        ring: "oklch(0.78 0.20 55)"
        textColor: "{colors.ember-text}"
        eyebrow: "TORCH | HEATING"
      target:
        core: "oklch(0.68 0.22 55)"
        glow: "oklch(0.78 0.24 55 / 0.95)"
        ring: "oklch(0.86 0.22 60)"
        textColor: "{colors.ember-text}"
        eyebrow: "AT TARGET"
      cooling:
        core: "oklch(0.45 0.18 50)"
        glow: "oklch(0.62 0.20 50 / 0.65)"
        ring: "oklch(0.74 0.20 55)"
        textColor: "{colors.bone-90}"
        eyebrow: "DAB WINDOW"
      dunk:
        core: "oklch(0.40 0.10 240)"
        glow: "oklch(0.62 0.10 240 / 0.55)"
        ring: "oklch(0.78 0.08 240)"
        textColor: "#e6effa"
        eyebrow: "DUNK READY"
---

## Brand & Style

Quartzie is a connected-device companion app for an IR thermometer used to time precision dabs on a quartz banger. The brand is cribbed from a fictional "QuartzOS" hardware aesthetic: deep-space navy backgrounds, hand-blown glass surfaces, and a single warm ember accent that does all the dramatic lifting. The personality is **minimalist, instrument-grade, and slightly theatrical** — equal parts laboratory readout and lifestyle product.

The defining move is the **central orb**. Every screen orbits a single refractive sphere whose color, size, and emission shift through the session: cold blue idle → glowing ember at target → cool blue dunk. The rest of the UI is deliberately quiet so the orb can carry the emotional load. Rectangles are avoided wherever possible; surfaces are discs, pills, and hairlines. Text is etched, not stamped.

Two rules govern the entire system. **Warm light is precious** — ember is reserved for active heat states, the primary CTA, the wordmark glyph, and one accent word in marketing copy. **Glass is structural** — every elevated surface is a backdrop-blur disc with a hairline rim and a top-light catch. Solid fills almost never appear.

## Colors

The palette is three tight families plus the ember accent. Five steps of `navy` form the canvas hierarchy, six steps of `bone` form the cool-tinted ink, and the ember/quartz pairs supply heat and cool semantics.

- **Navy stack** (`navy-0` through `navy-4`): from `#050a14` near-black to `#1a3052` rim. Used for canvas, surfaces, and bezel layers. Never lighter than `navy-4` for solid surfaces.
- **Bone stack** (`bone-100` through `bone-20`): cool blue-tinted off-whites. `bone-100` for headline ink, `bone-90` for body, `bone-50/35` for muted labels, `bone-20` for ghost edges. The cool tint is intentional — pure white reads warm against navy and breaks the temperature metaphor.
- **Ember**: the only saturated color in the entire system. `ember-bright` (oklch 0.78/0.20/55) is the maximum. It appears in the active orb, the primary pill button, the connected-status dot, the wordmark glyph, the progress-bar's "current" state, and the `accent-amber` text treatment that highlights one critical noun in display headlines (e.g. "Connect your **Dab Rite** to begin"). When ember appears, it's almost always paired with a glow shadow at 24–60px — emission, not paint.
- **Quartz**: the cool counterpart, used sparingly for "cold" states (the dunk-water phase). Same role as ember on the opposite end of the spectrum.

The body itself isn't a flat color. It's a five-stop gradient stack: a warm ember flare in the top-left corner at low alpha, a second warm flare bottom-right, a cool blue bloom rising from below the viewport, and a cool blue bloom dropping from above, all over a `#02050c` canvas-base. The result feels like **deep space lit from the orb outward**.

## Typography

The system uses **Geist** for everything visible to the eye and **Geist Mono** for everything that's data. There is no italic, no serif, no script. The CSS file keeps a `.serif` class for backward compatibility, but it now resolves to Geist with tight tracking — the visual identity is fully geometric.

- **Display headlines** are set in Geist Light (300) with aggressive negative tracking (`-0.035em`) and line-height 1.0. They are huge, calm, and unhurried. Inside a phone frame they sit at 26–32px; in marketing display contexts they scale to 64px+. One word per line is fine.
- **Display-bold** appears only in the wordmark "Quartzie" beside the orb glyph and in any "QuartzOS" treatment, set in Geist Bold (700) with `-0.025em` tracking. This is the brand voice.
- **Body** is Geist Regular at 13–15px, line-height 1.5, in `bone-90` or `bone-70`. It is supporting copy only — never used for primary information.
- **Eyebrows** are Geist Mono at 9–11px, weight 500, with `0.32em` tracking (extreme), uppercase. They label every section of the UI: `STANDBY`, `AT TARGET`, `DEVICE NOT FOUND`, `STEP 1/4 · BANGER`. They are the texture of the system.
- **Mono data** is Geist Mono with `tabular-nums` and `ss01` enabled, at 11–13px. It is reserved for measurements, timers, ranges, and any number that might tick.
- **The orb numerals** are a special case: Geist Light at 42–50% of the orb's diameter, line-height 0.88, tracking `-0.07em`. They sit on top of the glass with a state-colored text-shadow halo (`0 0 24px glow, 0 0 48px glow`) that makes them look projected from inside the sphere rather than painted on it.

## Layout & Spacing

The app is presented on a **canvas of phone frames**. Each frame is a 390×844 iPhone-style mockup with a 54px corner radius and a five-layer bezel shadow. Frames are arranged in a CSS grid (`auto-fit, minmax(420px, 1fr)`) with 56px vertical and 48px horizontal gaps, max canvas width 1700px, padded 32px from the viewport edges. Every frame carries an uppercase mono caption beneath it (`QUARTZIE · QUARTZ-OS DRIVEN`) at `bone-35`.

Inside the phone, content uses **22px horizontal padding** and is anchored to the orb. The wordmark sits at the top with 22px padding and 10px top inset. The orb is the centerpiece — vertically centered in the upper two-thirds of the screen. Below it sit metric strips, hairlines, preset bars, and the floating tab pill. The tab bar is always present in the session/presets/history/configure stages; it never inlines with content.

Spacing rhythm is on an **8/4 base** with named steps `xs:4, sm:8, md:14, lg:22, xl:32`. The 14px unit is interesting — most form-style libraries use 12 or 16; Quartzie's 14 gives controls a slightly tall, instrument-panel proportion.

Scrollbars are globally suppressed. Internal scroll regions exist but never show chrome — the surface should always read as a single physical object.

## Elevation & Depth

Depth is built from **physics, not from shadows in the conventional sense**. There are no Material-style elevation tiers. Instead, every surface is a piece of glass on top of a void.

- **The void** is the body. Its bloom gradients establish atmospheric depth — colors leak between elements and tint the air around them. The orb's ember halo bleeds well outside the phone frame and tints the canvas in heating/target states.
- **Glass discs** (`glass-disc`, `glass-disc-warm`) are how surfaces appear. Each disc has four layered effects: a `backdrop-filter: blur(22px) saturate(1.2)`, a translucent navy fill, a `0.5px` hairline rim, and a top-edge highlight (`inset 0 0.5px 0 rgba(255,255,255,0.10)`) that simulates light from above. Below the disc is a bottom-edge shadow lip and a 12–32px ambient drop. The warm variant adds an ember-tinted rim and a 24px outer bloom — the surface itself glows.
- **Hairlines** carry hierarchy where shadows would otherwise be needed. They are 0.5px gradients fading to transparent at both ends with a single 1px-equivalent dark drop — they read as cuts in the glass, not lines drawn on it.
- **The phone bezel** is a five-layer `box-shadow` chain that simulates a milled aluminum frame on a navy desk: 50px ambient drop, 1.5px inner bezel, 2px vacuum line, 8px outer bezel, 1.5px navy-4 rim highlight. This is exactly how it would render in product photography — light pickup on the top edge, hard cut on the inside.

The orb itself is the most extreme example of this philosophy: nine stacked layers (far ambient bloom, mid bloom, rotating caustics, hairline rim, multi-stop glass body, top refraction streak, lower refraction crescent, hot core, etched progress arc, etched cardinal ticks). It is built like a real piece of glass, not drawn as a circle.

## Shapes

The shape language is **circles, pills, and hairlines**. Rectangles appear only when they cannot be avoided.

- **Circles** carry meaning — the orb is the app, the wordmark glyph is a tiny orb, status dots are tiny orbs. Anything round-and-glowing is "alive."
- **Pills** (`100px` radius) carry every interactive surface that isn't a circle: CTAs, status chips, tab buttons, the tab bar shell itself. The pill is the system's only "tappable" shape.
- **Soft rectangles** (`14–18px` radius) are reserved for two cases: the inline preset bar inside the session screen, and the floating tweaks panel. They are exceptions, not defaults.
- **Hairlines** (`0.5px`) are the universal divider. They never become 1px. The half-pixel weight is deliberate — it forces the rim to read as light catching glass rather than a drawn line.

Icons are flat geometric SVG sigils — diamond, circle-with-pupil, triangle, rotated square — used for preset categories. There is no decorative iconography, no emoji, no illustration. The orb is the only thing allowed to be ornate.

## Components

### The Orb (`TempDial`)

The orb is the only component that demands its own section. It is built once and re-rendered with state changes; it is **never replaced** as the user moves between stages. Its diameter shrinks to ~150px during connect/configure flows, expands to 290–310px during active sessions, and contracts again during cleanup. Its color crossfades over 800ms whenever its `state` changes (`idle → heating → target → cooling → dunk`). It has a continuous 7-second breathing scale animation and a 22-second slow rotation on its caustic light layer that gives it ambient life even in idle.

The numeric readout inside the orb is the single highest-resolution piece of information in the UI — it is the user's reason for opening the app. Everything else exists to frame this number.

### Pill Buttons (`q-action`, `q-action-ghost`)

The primary `q-action` is the only fully-emissive component in the system: a vertical ember gradient with a top-edge wet highlight, a warm inner rim, a 28px warm cast shadow, and a 60px outer bloom. On hover it lifts 1px and the bloom widens. The ghost variant uses identical geometry but swaps the fill for a glass-disc — same shape, no emission. Use ember pills when an action commits to a state change (Connect, Start Session, Begin); use ghost pills for navigation (Back, Cancel, Change).

Disabled buttons drop to `rgba(180,200,230,0.06)` with `bone-35` text and lose all shadows.

### Status Chip & Connection Dot

A 4×10px pill near the top-right of every screen. Its dot indicates connection: `bone-35` flat for offline, `ember-bright` with an 8px glow for connected. The chip's text is a 9.5px Geist Mono eyebrow at `bone-50`. When the pill becomes interactive (offering "Disconnect"), the text remains the same weight but the pill gains a hover state.

### Tab Bar

A floating glass pill anchored 28px from the bottom of the phone, never touching the edge. Four tabs: Session, Presets, History, Configure. The active tab gets an inset navy gradient with a top highlight; idle tabs are transparent with `bone-50` ink. Transitions are a 200ms fade, no slide — the system prefers crossfade over motion.

### Eyebrows & Etched Text

Eyebrows label everything. They sit above headlines, beside metrics, and inside the orb. They use `0.32em` tracking, which is roughly 2× a typical "wide" tracking — extreme by design, because it makes uppercase mono text read as instrumentation rather than content. Etched text variants (`.etched`, `.etched-warm`) add 18–48px text-shadows in cool or warm tints; this is what gives the type its "projected onto glass" quality.

### Progress Indicators

Two flavors: the **strip** (3px-tall pill segments at the top of multi-step builders, ember-glowing on the current step) and the **etched arc** (a 1.25px stroke around the orb, stroke-color matching the orb state, with a 3px blurred halo behind for the "glow" effect). Both prefer ember progression; the arc switches to a dashed `1.5 5` pattern when the reading is estimated rather than measured, so the user can tell at a glance whether the number is real.

### Preset Cards (`PresetGlyph`)

A small rounded rectangle (30% radius — ~13px on a 44px card) holding a sigil. Four palettes (`quartz` warm-amber, `opaque` cool-blue, `custom` yellow-green, `low` cool-cyan) at low saturation, each with a `0.5px` ring, an inner top-light highlight, and (for the active `quartz` preset) a 12px warm bloom. The sigil is a simple SVG: diamond for quartz, concentric circle for opaque, triangle for custom, rotated square for low. This is the only place categorical color is allowed.

## Motion

Motion is **gentle, slow, and confident**. The signature easing is `cubic-bezier(0.22, 1, 0.36, 1)` — a heavy-front, soft-tail curve sometimes called "swoop." It appears on view enters, staggered children, key text changes, and pulses. Transitions between orb states take a deliberate 800ms — the orb is meant to feel like a physical object whose temperature is actually changing, not a UI that snaps to a new color.

Three motions are continuous and ambient: the orb's 7s breathing scale, the 2–2.4s opacity pulse on the hot core during heating/target, and the 22s caustic rotation. Together they create a sense that the app is alive even when the user isn't interacting. A fourth, rarer motion — the 2.4s `estimated-breathe` opacity pulse — appears only on numerals that are predicted rather than measured. This is the system's way of being honest about uncertainty without using a tooltip.

Stage-to-stage transitions use a layered enter: the new view fades in over 480ms with a 14px upward translate and a 4px blur clearing to zero, while children stagger in at 55ms intervals. The result is that information arrives in sequence, never in a single jump.

## Voice & Microcopy

Worth noting because it's part of the visual identity. The mono eyebrows are written in clipped, almost military shorthand: `STANDBY`, `AT TARGET`, `DUNK READY`, `DEVICE NOT FOUND`, `NO ADVANCE WITHOUT A DEVICE`. Display headlines are conversational and confident: "Connect your Dab Rite to begin.", "Torch the banger.", "Calibration locked." Body copy explains in one or two sentences and gets out of the way. The system never uses exclamation marks. It addresses the user as a competent operator of a precision instrument.