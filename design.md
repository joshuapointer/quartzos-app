---
name: Quartzie · Chromatic Glass

# ─────────────────────────────────────────────────────────────────────────────
# Source of truth: src/design/tokens.ts (May 2026 molten refresh).
# All hex values are perceptual approximations of the original oklch sources;
# oklch reference is preserved alongside each color for future Skia migration.
# Theme is dark-only by intent: a connoisseur on a couch in dim ambient light,
# the orb is the brightest thing in the room. Light theme would invert the
# protagonist relationship.
# ─────────────────────────────────────────────────────────────────────────────

colors:
  # ── Core backgrounds (cool-purple obsidian) ──
  background:                "#060507"   # oklch(0.08 0.012 250) page base
  surface:                   "#0e1018"   # oklch(0.13 0.018 245)
  surface-dim:               "#0a0c12"   # oklch(0.10 0.015 248)
  surface-bright:            "#252a3b"

  # ── Surface container ramp ──
  surface-container-lowest:  "#06070b"
  surface-container-low:     "#0c0e15"
  surface-container:         "#10131b"
  surface-container-high:    "#161924"
  surface-container-highest: "#1c2030"
  surface-variant:           "#1c2030"

  # ── Typography on dark surfaces ──
  on-background:             "#e8ecf2"   # bone-100, oklch(0.97 0.012 230)
  on-surface:                "#e8ecf2"
  on-surface-variant:        "#adb1b7"   # bone-60

  # ── Bone neutral ramp (cool warm-grey, used for body + telemetry) ──
  bone-100: "#e8ecf2"   # oklch(0.97 0.012 230)
  bone-90:  "#d3d7df"
  bone-80:  "#c8cdd4"   # oklch(0.88 0.012 230)
  bone-70:  "#b6bac1"
  bone-60:  "#adb1b7"   # oklch(0.78 0.010 230)
  bone-50:  "#9296a0"
  bone-40:  "#88898f"   # oklch(0.64 0.010 235)
  bone-35:  "#6a6b71"
  bone-25:  "#5e6066"   # oklch(0.48 0.010 240)
  bone-20:  "#43454d"

  # ── Prism (chromatic-glass accent system, reserved for the orb + active edges) ──
  # Cyan / magenta / gold split is the soul of the molten refresh. Never use any of
  # these as a flat fill on chrome surfaces; they are exclusively for the orb,
  # the prism-edge animated border, and the spectrum bar in the dab window.
  prism-cyan:         "#3acdf0"   # oklch(0.84 0.12 200)
  prism-magenta:      "#e370d3"   # oklch(0.78 0.18 320)
  prism-gold:         "#f0d670"   # oklch(0.90 0.14 95)
  prism-cyan-soft:    "rgba(58,205,240,0.55)"
  prism-magenta-soft: "rgba(227,112,211,0.55)"
  prism-gold-soft:    "rgba(240,214,112,0.55)"

  # ── Primary semantic (mapped to prism cyan, the most "active" stop) ──
  primary:                "#3acdf0"
  on-primary:             "#001520"
  primary-container:      "#e370d3"   # prism-magenta
  on-primary-container:   "#280020"

  # ── Secondary (muted cool grey-blue) ──
  secondary:              "#c1c6d5"
  on-secondary:           "#2b313c"
  secondary-container:    "#414753"
  on-secondary-container: "#b0b5c3"

  # ── Tertiary (Quartz cool blue, kept for non-prism consumers) ──
  tertiary:               "#95ccff"
  on-tertiary:            "#003352"
  tertiary-container:     "#00a8ff"
  on-tertiary-container:  "#003a5c"

  # ── Outlines & error ──
  outline:                "#5e6066"
  outline-variant:        "#2b2e3a"
  error:                  "#ff6b6b"
  on-error:               "#330000"
  error-container:        "#5a0a0a"
  on-error-container:     "#ffd6d6"

  # ── Glass surface tints (rgba — used by BlurView overlays + picker shells) ──
  glass-thin:        "rgba(252,252,255,0.04)"
  glass-thick:       "rgba(252,252,255,0.08)"
  glass-pane:        "rgba(252,252,255,0.05)"
  glass-edge:        "rgba(252,252,255,0.16)"
  glass-edge-strong: "rgba(252,252,255,0.32)"

  # ── Background haze (body radial-gradient bloom layers) ──
  bg-haze-cyan:     "rgba(38, 71, 102, 0.40)"   # oklch(0.14 0.05 220 / 0.40) at 28% 18%
  bg-haze-magenta:  "rgba(82, 41, 92, 0.35)"    # oklch(0.13 0.06 320 / 0.35) at 78% 85%
  bg-center-bloom:  "rgba(20, 18, 36, 0.32)"    # oklch(0.10 0.020 270 / 0.32) at 52% 50%

  # ── Semantic ──
  warning: "#f0d670"   # prism-gold
  success: "#7EC8A0"

# ─────────────────────────────────────────────────────────────────────────────
# Color strategy: Restrained body, Drenched orb.
# Chrome surfaces (chips, panels, pickers, recents row) are restrained,
# bone-on-obsidian with glass tints; the only saturated color allowed on chrome
# is a single prism-edge stroke at 0.75px. The orb itself is drenched, the
# entire chromatic system lives there. Never color-spread accents to chrome.
# ─────────────────────────────────────────────────────────────────────────────

typography:
  # ── Display (Instrument Serif Italic — orb temp readouts, big numbers) ──
  serif-display:
    fontFamily: "Instrument Serif"
    fontSize: "96px"
    fontWeight: 400
    fontStyle: "italic"
    lineHeight: "96px"
    letterSpacing: "-0.04em"

  # ── Headline (Instrument Serif Italic — picker titles, copy-stack headlines) ──
  serif-headline:
    fontFamily: "Instrument Serif"
    fontSize: "26px"
    fontWeight: 400
    fontStyle: "italic"
    lineHeight: "31px"
    letterSpacing: "-0.01em"

  # ── Card (Instrument Serif Italic — banger card name, tile name) ──
  serif-card:
    fontFamily: "Instrument Serif"
    fontSize: "18px"
    fontWeight: 400
    fontStyle: "italic"
    lineHeight: "19px"
    letterSpacing: "-0.01em"

  # ── Display-large (Geist Light — secondary big numbers) ──
  display:
    fontFamily: "Geist"
    fontSize: "48px"
    fontWeight: 300
    lineHeight: "53px"
    letterSpacing: "-0.04em"

  # ── Headlines ──
  h1:
    fontFamily: "Geist"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: "38px"
    letterSpacing: "-0.02em"

  h2:
    fontFamily: "Geist"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: "29px"
    letterSpacing: "-0.02em"

  # ── Body ──
  body-lg:
    fontFamily: "Geist"
    fontSize: "18px"
    fontWeight: 300
    lineHeight: "26px"

  body:
    fontFamily: "Geist"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "26px"

  # ── Telemetry (Geist Mono — labels, eyebrows, data values) ──
  data-value:
    fontFamily: "Geist Mono"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"

  caption:
    fontFamily: "Geist Mono"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0.4px"

  data-label:
    fontFamily: "Geist Mono"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "12px"
    letterSpacing: "1.2px"
    textTransform: "uppercase"

  label-caps:
    fontFamily: "Geist Mono"
    fontSize: "10px"
    fontWeight: 500
    letterSpacing: "2.2px"
    textTransform: "uppercase"

  mono-eyebrow:
    fontFamily: "Geist Mono"
    fontSize: "9px"
    fontWeight: 500
    lineHeight: "12px"
    letterSpacing: "0.28em"
    textTransform: "uppercase"

  mono-chip:
    fontFamily: "Geist Mono"
    fontSize: "9.5px"
    fontWeight: 500
    lineHeight: "12px"
    letterSpacing: "0.20em"
    textTransform: "uppercase"

# ─────────────────────────────────────────────────────────────────────────────
# Type rules:
#   - Serif italic ALWAYS for the orb temp, picker titles, and copy-stack
#     headlines. Never use the serif for chrome labels or data.
#   - Mono ALWAYS for telemetry, status chips, eyebrows, and uppercase labels.
#     Caps tracking is non-negotiable: 0.20em–0.32em depending on size.
#   - Sans (Geist) is the body workhorse, default to 400; reserve 300 for the
#     48px display only.
#   - Numerals: tabular/lining nums for any countdown or live readout to
#     prevent jitter (font-variant-numeric: lining-nums).
# ─────────────────────────────────────────────────────────────────────────────

spacing:
  unit: "4px"
  xs:   "8px"
  sm:   "16px"
  md:   "32px"
  element-gap:        "24px"
  container-padding:  "40px"
  lg:   "64px"
  xl:   "128px"
  xxl:  "48px"

radius:
  sm:   "8px"
  md:   "16px"
  lg:   "32px"
  xl:   "48px"
  full: "9999px"

elevation:
  # On a deep cool-purple background, shadow color is functionally near-black —
  # kept as #000 so elevated components read as a clean cut-out.
  card:
    color: "#000000"
    offset: "0 4px"
    opacity: 0.5
    blur: "12px"
    elevation: 8
  button:
    color: "#000000"
    offset: "0 2px"
    opacity: 0.4
    blur: "6px"
    elevation: 4
  orb:
    # The only colored shadow in the system. Reserved for the protagonist.
    color: "#3acdf0"   # prism-cyan
    offset: "0 0"
    opacity: 0.45
    blur: "28px"
    elevation: 16

motion:
  duration:
    instant:    "150ms"
    tap:        "160ms"
    tooltip:    "180ms"
    quick:      "200ms"
    popover:    "220ms"
    modal:      "240ms"
    base:       "400ms"
    enter:      "480ms"
    smooth:     "600ms"
    deliberate: "800ms"
    slow:       "900ms"

  exit:
    tap:     "100ms"
    tooltip: "140ms"
    popover: "160ms"
    modal:   "180ms"

  easing:
    # Standard quartz family — fast out, soft settle. No bounce, no elastic.
    ease-out:    "cubic-bezier(0.22, 1, 0.36, 1)"
    ease-in-out: "cubic-bezier(0.77, 0, 0.175, 1)"
    drawer:      "cubic-bezier(0.32, 0.72, 0, 1)"
    swoop:       "cubic-bezier(0.22, 1, 0.36, 1)"
    # Custom curves named for the molten refresh
    spring:      "cubic-bezier(0.22, 1.4, 0.36, 1)"   # subtle overshoot, used for orb scale
    quartz:      "cubic-bezier(0.16, 0.84, 0.24, 1)"  # the default for chrome
    mercury:     "cubic-bezier(0.7, 0, 0.3, 1)"       # phase transitions

  loops:
    shimmer-duration:    "4200ms"
    pulse-duration:      "1400ms"
    prism-drift:         "9000ms"   # animated chromatic edge stroke
    orbit-duration:      "30000ms"

  springs:
    press:   { damping: 14, stiffness: 220, mass: 0.6 }
    toggle:  { damping: 15, stiffness: 260, mass: 0.5 }
    thumb:   { damping: 18, stiffness: 200, mass: 0.7 }
    toast:   { damping: 22, stiffness: 200, mass: 0.9 }
    orb:     { damping: 18, stiffness: 140, mass: 1.0 }

# ─────────────────────────────────────────────────────────────────────────────
# Motion rules:
#   - Layout properties (width/height/top/left) are never animated. Use transform
#     and opacity only.
#   - Default chrome curve is `quartz` at 200–400ms.
#   - Phase transitions (idle → heating → window → dunk → complete) use `mercury`
#     at 480–600ms; mercury hits zero at the boundaries so phases lock in cleanly.
#   - The orb uses the `orb` spring for scale, prism-drift for its edge ring,
#     and pulse-duration (1400ms) for ambient breath.
#   - Reduced motion: clamp orb pulse to opacity-only at 1400ms, freeze prism
#     drift, drop bloom-layer animation entirely.
# ─────────────────────────────────────────────────────────────────────────────

components:
  # ── The orb (protagonist) ──
  molten-orb:
    description: |
      The single loud element. A 3D React-Three-Fiber sphere with a chromatic
      iridescent surface (cyan/magenta/gold dispersion), a soft outer glow, and
      a state-driven spark system. Temperature readout sits at its center in
      Instrument Serif Italic 96. Scale and Y position are driven by phase:
      idle (small, low), heating (medium, center), window (large, slightly
      raised), dunk/complete (return to small).
    surface: "iridescent radial gradient cyan→magenta→gold over deep cool base"
    glow: "prism-cyan colored shadow (elevation.orb), 28px blur, 0.45 opacity"
    motion: "orb spring for scale, 1400ms pulse for breath, 9s prism-drift on edge halo"
    typography: "serif-display (96px Instrument Serif Italic) for the temp value"
    rules:
      - "Never duplicated on a screen. One orb, always."
      - "Only element allowed to use the prism palette as fill."
      - "Reduced-motion variant: opacity pulse only, no scale, no drift."

  # ── Prism edge ──
  prism-edge:
    description: |
      A 0.75px animated chromatic stroke (cyan→magenta→gold @ 135°, 220% size,
      9s drift loop) used as a hairline border on active glass surfaces. Built
      with mask-composite to render only the ring, not the fill.
    usage: "Active picker shells, the focus ring on interactive glass cards, status chip when live."
    rules:
      - "Never thicker than 1px."
      - "Never used as a side-stripe (left/right only border). Full-perimeter only."
      - "Never used on inactive surfaces; if it's drifting, the surface is doing something."

  # ── Glass panel ──
  glass-panel:
    description: |
      Translucent surface tinted with `glass-pane` (rgba 252,252,255 / 0.05),
      backdrop-filter blur(22px) saturate(140%), 0.5px solid `glass-edge` border.
      Sits over the bloom-layered obsidian background.
    usage: "Picker shells, drawer overlays, the bottom-of-screen carousel surface."
    rules:
      - "Never nest glass panels. The blur compounds and reads as a smear."
      - "Always over the bloom background; on a flat surface the blur has nothing to bend."
      - "Do not apply to interactive elements smaller than 64px square — the edge anti-aliases poorly."

  # ── Status chip ──
  status-chip:
    description: |
      App-owned status pill at the bottom of the screen, above the home
      indicator. Glass panel + chromatic gem (bone-100 dot with cyan/magenta
      offset shadows + 0.4 white glow), mono-chip caps text at 9.5px / 0.20em.
      Pulses at 1.8s ease-in-out when active.
    placement: "Centered horizontally, bottom: 26px, z-index: 45 (above content, below modals)."
    motion: "Fade + 6px slide-in over 380ms quartz when state changes."
    rules:
      - "Never carries critical data. The orb owns critical state; the chip is supporting telemetry only."
      - "Only one chip on screen at a time. If two states need to be communicated, expand the orb's eyebrow line."

  # ── Picker shell ──
  picker:
    description: |
      Bottom 60% glass overlay with a vertical gradient fade from transparent
      through 30%→55%→78% obsidian opacity. Backdrop blur 28px, saturate 150%.
      Header row uses serif-headline (22–26px) + mono eyebrow meta. The
      picker-bottom-fade adds a 24px solid bottom edge so content scrolls under
      the home indicator.
    usage: "Banger carousel, concentrate grid, recents row, preset picker."
    rules:
      - "One picker open at a time. Stack means the user has lost the orb's signal."
      - "Pickers do not modal-block. The orb stays interactive behind them."

  # ── Copy stack ──
  copy-stack:
    description: |
      Vertical stack of three lines: prism-cyan eyebrow (mono caps 0.32em),
      headline (serif italic 26px), and supporting body (sans 13px bone-60).
      Max-width 280px, 6px gap. Used as the orb's caption during state changes
      (e.g. "WINDOW · OPENS IN" / "Your dab will land cleanest here" / "Hold the rig").
    rules:
      - "Always under the orb, never over."
      - "Never more than three lines. If you need four, you're explaining; the orb should be doing the explaining."

  # ── Cards (banger / concentrate tiles) ──
  tile-card:
    description: |
      Glass-pane fill, glass-edge border, radius.md (16px). Tile name in
      serif-card (18px italic), spec line in caption (mono 12px). Active state
      adds a prism-edge stroke instead of changing fill.
    rules:
      - "Cards are not the default. Only used for the banger carousel and concentrate grid where browsing is the point."
      - "Never nested. A card inside a card is always wrong."
      - "All tiles in a row are the same size; varying tile sizes is for editorial layouts, not pickers."

  # ── Recents row ──
  recents-row:
    description: |
      Horizontal strip of compact entries (banger emoji, concentrate name,
      timestamp). No card chrome — just typography on the bloom background,
      separated by 24px element-gap. Tappable area extends 12px above and below
      the visible text.
    rules:
      - "Last 4 entries only. More than 4 and the row competes with the orb."
      - "Tapping a recent restores the full session config (banger + concentrate + temp), not just the temp."

# ─────────────────────────────────────────────────────────────────────────────
# Component bans (in addition to the impeccable shared bans):
#   - Side-stripe accents on cards. Use prism-edge full-perimeter or nothing.
#   - Boolean toggles styled as cards. Use CrystalToggle (the dedicated
#     skeuomorphic switch in src/design/components).
#   - Modal-as-first-thought. The Altar is single-surface; reach for an
#     overlay (heating, window, swab, dunk, complete) before a modal.
#   - Hero-metric template. The orb is the metric; never duplicate it as a
#     "big number / small label / supporting stats" tile.
# ─────────────────────────────────────────────────────────────────────────────

# ─────────────────────────────────────────────────────────────────────────────
# Background composition (body shell):
#   Three radial-gradient bloom layers on top of #060507 obsidian:
#     1. cyan haze   @ 28% 18%   (bg-haze-cyan,   55% radius)
#     2. magenta haze @ 78% 85%  (bg-haze-magenta, 60% radius)
#     3. center bloom @ 52% 50%  (bg-center-bloom, 70% radius)
#   The blooms give the obsidian its dimensional depth and feed the
#   backdrop-filter on glass panels. Without the blooms, glass surfaces look
#   like solid gray rectangles.
# ─────────────────────────────────────────────────────────────────────────────
---
