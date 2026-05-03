import { Easing } from 'react-native-reanimated';

// ─────────────────────────────────────────────────────────────────────────────
// Quartzie · Molten Refresh — Chromatic Glass (May 2026)
//
// Source of truth: /Users/joshpointer/Downloads/quartzie-molten-refresh.html
//
// Three-axis palette:
//   1. Cool obsidian backgrounds — deep cool-purple/teal that lets glow read
//   2. Bone neutrals — cool warm-grey ramp for typography on dark surfaces
//   3. Prism accents — cyan / magenta / gold split that paints active edges,
//      the orb's iridescence, and the spectrum bar in the dab window
//
// React Native cannot consume oklch() directly; the hex values below are
// perceptual approximations of the original oklch sources, kept in
// /* oklch(...) */ comments for reference + future Skia migration.
// ─────────────────────────────────────────────────────────────────────────────
export const colors = {
  // ── Core backgrounds (cool-purple obsidian) ──
  background:              '#060507', /* oklch(0.08 0.012 250) — page base   */
  surface:                 '#0e1018', /* oklch(0.13 0.018 245) — surface     */

  // ── Surface container ramp ──
  surfaceContainerHigh:    '#161924',

  // ── Numeric ramp (back-compat — consumed via ThemeColors) ──
  bgDeep:        '#060507',
  surface1:      '#0a0c12',
  surface3:      '#10131b',
  surface6:      '#252a3b',
  surfaceBright: '#252a3b',

  // ── Typography on dark surfaces ──
  onBackground:      '#e8ecf2', /* bone-100 ≈ oklch(0.97 0.012 230) */
  onSurface:         '#e8ecf2',
  onSurfaceVariant:  '#adb1b7', /* bone-60 */

  // ── Bone neutral ramp (cool warm-grey) ──
  bone100: '#e8ecf2', /* oklch(0.97 0.012 230) */
  bone90:  '#d3d7df', /* extra step for back-compat */
  bone80:  '#c8cdd4', /* oklch(0.88 0.012 230) */
  bone70:  '#b6bac1',
  bone60:  '#adb1b7', /* oklch(0.78 0.010 230) */
  bone50:  '#9296a0',
  bone40:  '#88898f', /* oklch(0.64 0.010 235) */
  bone35:  '#6a6b71',
  bone25:  '#5e6066', /* oklch(0.48 0.010 240) */
  bone20:  '#43454d',

  // ── Prism (chromatic-glass accent system) ──
  // Cyan / magenta / gold split — the soul of the molten refresh.
  prismCyan:        '#3acdf0', /* oklch(0.84 0.12 200) */
  prismMagenta:     '#e370d3', /* oklch(0.78 0.18 320) */
  prismGold:        '#f0d670', /* oklch(0.90 0.14 95)  */

  // ── Primary semantic (mapped to prism for back-compat consumers) ──
  primary:                '#3acdf0', /* prismCyan — the most "active" prism stop */
  onPrimary:              '#001520',
  primaryContainer:       '#e370d3', /* prismMagenta */
  onPrimaryContainer:     '#280020',
  // ── Secondary (muted cool grey-blue) ──
  secondary:                '#c1c6d5',
  onSecondary:              '#2b313c',
  secondaryContainer:       '#414753',
  onSecondaryContainer:     '#b0b5c3',
  // ── Tertiary (Quartz cool blue — preserved for non-prism consumers) ──
  tertiary:                '#95ccff',
  onTertiary:              '#003352',
  tertiaryContainer:       '#00a8ff',
  onTertiaryContainer:     '#003a5c',
  // ── Outlines & error ──
  outline:           '#5e6066',
  outlineVariant:    '#2b2e3a',
  error:             '#ff6b6b',
  onError:           '#330000',
  errorContainer:    '#5a0a0a',
  onErrorContainer:  '#ffd6d6',

  // ── Ember semantic ramp (back-compat — emberBright/emberDeep consumed by QWordmark/color-picker) ──
  emberBright:  '#3acdf0', /* prismCyan — peak energy */
  emberDeep:    '#001520',

  // ── Quartz semantic ramp (back-compat — quartzBright consumed by QWordmark, quartzDim by color-picker) ──
  quartzBright: '#95ccff',
  quartzDim:    '#3884b8',

  // ── Brass (custom preset accent — desaturated olive-gold) ──
  brass: '#C4AC54',

  // ── Semantic ──
  warning: '#f0d670', /* prismGold */
  success: '#7EC8A0',

  // ── Glass surface tints (rgba — used by BlurView overlays) ──
  glassThin:        'rgba(252,252,255,0.04)',
  glassThick:       'rgba(252,252,255,0.08)',
  glassPane:        'rgba(252,252,255,0.05)',
  glassEdge:        'rgba(252,252,255,0.16)',
  glassEdgeStrong:  'rgba(252,252,255,0.32)',
  glassEdgeFaint:   'rgba(252,252,255,0.10)',

  // ── Text shadow / glyph helpers ──
  textShadowDark: 'rgba(0,0,0,0.7)',

  // ── Orb chromatic fringe ──
  fringePos: '#00f0ff',
  fringeNeg: '#ff0055',

  // ── Orb outline fallback ──
  orbOutlineDefault: '#ffffff',

  // ── Glass + text aliases (consumed by ThemeColors, settings, color-picker, onboarding) ──
  glassFill:         'rgba(252,252,255,0.05)',
  glassBorder:       'rgba(252,252,255,0.16)',
  textPrimary:   '#e8ecf2',
  textSecondary: '#adb1b7',
  textDim:       '#88898f',

  // ── Background haze tokens (body radial gradient layers) ──
  // Source: /Downloads/quartzie-molten-refresh.html body background
  bgHazeCyan:       'rgba(38, 71, 102, 0.40)',  /* oklch(0.14 0.05 220 / 0.40) — cyan haze at 28% 18% */
  bgHazeMagenta:    'rgba(82, 41, 92, 0.35)',   /* oklch(0.13 0.06 320 / 0.35) — magenta haze at 78% 85% */
  bgCenterBloom:    'rgba(20, 18, 36, 0.32)',   /* oklch(0.10 0.020 270 / 0.32) — center bloom at 52% 50% */

  // ── Semantic aliases (camelCase) ──
  voidObsidian:  '#060507',
  surfaceMid:    '#0e1018',
  surfaceRaised: '#161924',
  warmBone:      '#e8ecf2',
  boneMid:       '#c8cdd4',
  boneDim:       '#88898f',
  boneGhost:     '#5e6066',
  firedAmber:    '#3acdf0',
  emberGlow:     '#e370d3',
  coldSlate:     '#95ccff',
  quartzMid:     '#00a8ff',
};

// ─────────────────────────────────────────────────────────────────────────────
// Prism — animated chromatic accent values used by PrismEdge primitives
// ─────────────────────────────────────────────────────────────────────────────
export const prism = {
  cyan:        colors.prismCyan,
  magenta:     colors.prismMagenta,
  gold:        colors.prismGold,
  cyanSoft:    'rgba(58,205,240,0.55)',
  magentaSoft: 'rgba(227,112,211,0.55)',
  goldSoft:    'rgba(240,214,112,0.55)',
  // Linear gradient preset (used by SVG strokes + LinearGradient consumers)
  gradient:     [colors.prismCyan, colors.prismMagenta, colors.prismGold] as const,
  gradientSoft: ['rgba(58,205,240,0.55)', 'rgba(227,112,211,0.55)', 'rgba(240,214,112,0.55)'] as const,
  // Drift period for animated gradient (matches index.html prism-drift 9s)
  driftDurationMs: 9000,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Glass — surface tints used by GlassPanel + BlurView overlays
// ─────────────────────────────────────────────────────────────────────────────
export const glass = {
  thin:        colors.glassThin,
  thick:       colors.glassThick,
  pane:        colors.glassPane,
  edge:        colors.glassEdge,
  edgeStrong:  colors.glassEdgeStrong,
} as const;

export const gradients = {
  heatCore:    ['rgba(58,205,240,0)', 'rgba(58,205,240,0.18)', 'rgba(58,205,240,0.45)'] as const,
  cardNeutral: ['rgba(252,252,255,0.05)', 'rgba(252,252,255,0.02)'] as const,
  secondary:   ['#95ccff', '#00a8ff', '#004a75'] as const,
  gloss:       ['rgba(252,252,255,0.10)', 'rgba(252,252,255,0)'] as const,
  // Spectrum bar — celebratory chromatic band shown in the dab window
  spectrum:    ['rgba(58,205,240,0)', colors.prismCyan, colors.prismMagenta, colors.prismGold, 'rgba(240,214,112,0)'] as const,
  // Banger card photo placeholder
  photoPlaceholder: ['rgba(32,26,58,0.45)', 'rgba(20,20,40,0.30)', 'rgba(10,12,24,0.55)'] as const,
  // Concentrate tile bottom fade
  tileShadeBottom: ['transparent', 'rgba(0,0,0,0.78)'] as const,
  // Recents row preset card top region
  presetCardTop: ['#2a1a4a', '#0a0c18'] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// Spacing rhythm
// ─────────────────────────────────────────────────────────────────────────────
export const spacing = {
  xs: 8,
  sm: 16,
  md: 32,
  lg: 64,
  xl: 128,
} as const;

export const radius = {
  sm: 8, md: 16, lg: 32, xl: 48, full: 9999,
} as const;

// On a deep cool-purple background, shadow color is functionally near-black —
// kept as #000 so elevated components read as a clean cut-out.
const SHADOW_COLOR = '#000000';

export const shadow = {
  card: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Typography
//   Display: Instrument Serif Italic — big numbers + headline copy
//   Sans:    Geist (per-weight families) — body + buttons
//   Mono:    Geist Mono — labels, eyebrows, data values
//
// Expo Google Fonts ships per-weight families; use the explicit family name and
// omit fontWeight so iOS/Android resolve identically.
// ─────────────────────────────────────────────────────────────────────────────
export const fonts = {
  // serif-display: 96px Instrument Serif Italic — orb temp readouts, big numbers
  serifDisplay: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontSize: 96,
    letterSpacing: -3.84,   // -0.04em * 96
    lineHeight: 96,
    fontStyle: 'italic' as const,
  },
  // serif-headline: 26px Instrument Serif Italic — picker titles, copy-stack headlines
  serifHeadline: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontSize: 26,
    letterSpacing: -0.26,   // -0.01em * 26
    lineHeight: 31,
    fontStyle: 'italic' as const,
  },
  // serif-card: 18px Instrument Serif Italic — banger card name, tile name
  serifCard: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontSize: 18,
    letterSpacing: -0.18,
    lineHeight: 19,
    fontStyle: 'italic' as const,
  },
  // headline-md
  h1: {
    fontFamily: 'Geist_400Regular',
    fontSize: 32,
    letterSpacing: -0.64,
    lineHeight: 38,
  },
  h2: {
    fontFamily: 'Geist_400Regular',
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 29,
  },
  body: {
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    lineHeight: 26,
  },
  caption: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 12,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  dataLabel: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12,
    textTransform: 'uppercase' as const,
  },
  labelCaps: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase' as const,
  },
  // mono-eyebrow: 9px caps · 0.28em tracking — picker meta, eyebrows
  monoEyebrow: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 9,
    letterSpacing: 2.52,
    lineHeight: 12,
    textTransform: 'uppercase' as const,
  },
  // mono-chip: 9.5px caps · 0.20em tracking — status chip
  monoChip: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 9.5,
    letterSpacing: 1.9,
    lineHeight: 12,
    textTransform: 'uppercase' as const,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Motion tokens — durations and easings.
// ─────────────────────────────────────────────────────────────────────────────
export const motion = {
  duration: {
    tap:     160,
    popover: 220,
    base:    400,
  },
  exit: {
    tap:     100,
    popover: 160,
  },
  easing: {
    easeOut: [0.22, 1, 0.36, 1] as const,
    swoop:   [0.22, 1, 0.36, 1] as const,
    quartz:  [0.16, 0.84, 0.24, 1] as const,   // --ease-quartz
  },
} as const;

export const reanimatedEasing = {
  easeOut: Easing.bezier(...motion.easing.easeOut),
  quartz:  Easing.bezier(...motion.easing.quartz),
};

export const animation = {
  prismDriftMs:      9000, // matches index.html prism-drift @ 9s
  pressSpring:  { damping: 14, stiffness: 220, mass: 0.6 },
  toggleSpring: { damping: 15, stiffness: 260, mass: 0.5 },
  thumbSpring:  { damping: 18, stiffness: 200, mass: 0.7 },
  toastSpring:  { damping: 22, stiffness: 200, mass: 0.9 },
  orbSpring:         { damping: 18, stiffness: 140, mass: 1.0 },
  orbPositionSpring: { damping: 18, stiffness: 110, mass: 1 },
};
