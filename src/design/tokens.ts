import { Dimensions } from 'react-native';
import { Easing } from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export { SCREEN_W, SCREEN_H };

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
  surfaceDim:              '#0a0c12', /* oklch(0.10 0.015 248)               */

  // ── Surface container ramp ──
  surfaceContainerLowest:  '#06070b',
  surfaceContainerLow:     '#0c0e15',
  surfaceContainer:        '#10131b',
  surfaceContainerHigh:    '#161924',
  surfaceContainerHighest: '#1c2030',
  surfaceVariant:          '#1c2030',

  // ── Numeric ramp (legacy aliases — back-compat) ──
  bgDeep:        '#060507',
  surface1:      '#0a0c12',
  surface2:      '#0e1018',
  surface3:      '#10131b',
  surface4:      '#161924',
  surface5:      '#1c2030',
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
  prismCyanSoft:    'rgba(58,205,240,0.55)',
  prismMagentaSoft: 'rgba(227,112,211,0.55)',
  prismGoldSoft:    'rgba(240,214,112,0.55)',

  // ── Primary semantic (mapped to prism for back-compat consumers) ──
  primary:                '#3acdf0', /* prismCyan — the most "active" prism stop */
  onPrimary:              '#001520',
  primaryContainer:       '#e370d3', /* prismMagenta */
  onPrimaryContainer:     '#280020',
  primaryFixed:           '#3acdf0',
  primaryFixedDim:        '#9bdef2',
  onPrimaryFixed:         '#001520',
  onPrimaryFixedVariant:  '#003f56',

  // ── Secondary (muted cool grey-blue) ──
  secondary:                '#c1c6d5',
  onSecondary:              '#2b313c',
  secondaryContainer:       '#414753',
  onSecondaryContainer:     '#b0b5c3',
  secondaryFixed:           '#dde2f1',
  secondaryFixedDim:        '#c1c6d5',
  onSecondaryFixed:         '#161c26',
  onSecondaryFixedVariant:  '#414753',

  // ── Tertiary (Quartz cool blue — preserved for non-prism consumers) ──
  tertiary:                '#95ccff',
  onTertiary:              '#003352',
  tertiaryContainer:       '#00a8ff',
  onTertiaryContainer:     '#003a5c',
  tertiaryFixed:           '#cde5ff',
  tertiaryFixedDim:        '#95ccff',
  onTertiaryFixed:         '#001d32',
  onTertiaryFixedVariant:  '#004a75',

  // ── Outlines & error ──
  outline:           '#5e6066',
  outlineVariant:    '#2b2e3a',
  error:             '#ff6b6b',
  onError:           '#330000',
  errorContainer:    '#5a0a0a',
  onErrorContainer:  '#ffd6d6',

  // ── Ember semantic ramp (kept for back-compat — now points to prism) ──
  // Heat in the molten refresh is read as brightness + dispersion, not warm hue.
  // These map onto prism stops so any consumer still rendering "ember" gets a
  // chromatic stand-in instead of an off-palette orange.
  emberBright:  '#3acdf0', /* prismCyan — peak energy */
  ember:        '#9bdef2',
  emberDeep:    '#001520',
  emberMid:     '#5e8aa8',
  emberCool:    '#3acdf0',

  // ── Quartz semantic ramp ──
  quartzBright: '#95ccff',
  quartz:       '#00a8ff',
  quartzDeep:   '#004a75',
  quartzDim:    '#3884b8',

  // ── Brass (custom preset accent — desaturated olive-gold) ──
  brass: '#C4AC54',

  // ── amberGold rebound to prism gold for chromatic consistency ──
  amberGold: '#f0d670',

  // ── Inner lens colors (TempDial back-compat) ──
  lensIdle:    '#0a0c12',
  lensHeating: '#10131b',
  lensTarget:  '#161924',
  lensCooling: '#0a1218',
  lensDunk:    '#0c2640',

  // ── Semantic ──
  warning: '#f0d670', /* prismGold */
  success: '#7EC8A0',

  // ── Glass surface tints (rgba — used by BlurView overlays) ──
  glassThin:        'rgba(252,252,255,0.04)',
  glassThick:       'rgba(252,252,255,0.08)',
  glassPane:        'rgba(252,252,255,0.05)',
  glassEdge:        'rgba(252,252,255,0.16)',
  glassEdgeStrong:  'rgba(252,252,255,0.32)',

  // ── Backward-compat aliases ──
  inversePrimary:    '#060507',
  glassFill:         'rgba(252,252,255,0.05)',
  glassBorder:       'rgba(252,252,255,0.16)',
  heatIdle:          '#95ccff',
  heatAmber:         '#3acdf0',
  heatGlow:          '#e370d3',
  heatCyan:          '#3acdf0',
  heatCooling:       '#5fa8d4',
  ruby:      '#e370d3',
  amethyst:  '#95ccff',
  emerald:   '#7EC8A0',
  sapphire:  '#00a8ff',
  citrine:   '#f0d670',
  idleDeep:      '#060507',
  textPrimary:   '#e8ecf2',
  textSecondary: '#adb1b7',
  textDim:       '#88898f',
  crystalEdge:   'rgba(252,252,255,0.16)',
  glassDeep:     'rgba(0,0,0,0.6)',
  activeAmber:   '#3acdf0',
  activeGlow:    '#e370d3',
  activeDark:    '#10131b',

  // ── Background haze tokens (body radial gradient layers) ──
  // Source: /Downloads/quartzie-molten-refresh.html body background
  bgHazeCyan:       'rgba(38, 71, 102, 0.40)',  /* oklch(0.14 0.05 220 / 0.40) — cyan haze at 28% 18% */
  bgHazeMagenta:    'rgba(82, 41, 92, 0.35)',   /* oklch(0.13 0.06 320 / 0.35) — magenta haze at 78% 85% */
  bgCenterBloom:    'rgba(20, 18, 36, 0.32)',   /* oklch(0.10 0.020 270 / 0.32) — center bloom at 52% 50% */

  // ── Semantic aliases (camelCase) ──
  voidObsidian:  '#060507',
  surfaceDeep:   '#060507',
  surfaceMid:    '#0e1018',
  surfaceRaised: '#161924',
  surfaceMuted:  '#1c2030',
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
  cyanSoft:    colors.prismCyanSoft,
  magentaSoft: colors.prismMagentaSoft,
  goldSoft:    colors.prismGoldSoft,
  // Linear gradient preset (used by SVG strokes + LinearGradient consumers)
  gradient:     [colors.prismCyan, colors.prismMagenta, colors.prismGold] as const,
  gradientSoft: [colors.prismCyanSoft, colors.prismMagentaSoft, colors.prismGoldSoft] as const,
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
  // Body background — three radial-ish stops layered to fake the index.html bloom
  background:  ['#060507', '#0a0c12', '#060507'] as const,
  ember:       [colors.prismCyan, colors.prismMagenta, colors.prismGold] as const,
  quartz:      ['#95ccff', '#00a8ff', '#004a75'] as const,
  heatCore:    ['rgba(58,205,240,0)', 'rgba(58,205,240,0.18)', 'rgba(58,205,240,0.45)'] as const,
  cardActive:  [colors.prismCyan, colors.prismMagenta] as const,
  cardInactive: ['rgba(252,252,255,0.04)', 'rgba(252,252,255,0)'] as const,
  cardNeutral: ['rgba(252,252,255,0.05)', 'rgba(252,252,255,0.02)'] as const,
  amethyst:    ['#95ccff', '#00a8ff', '#004a75'] as const,
  primary:     [colors.prismCyan, colors.prismMagenta, colors.prismGold] as const,
  secondary:   ['#95ccff', '#00a8ff', '#004a75'] as const,
  wordmark:    ['#e8ecf2', '#c8cdd4'] as const,
  crystal:     ['rgba(252,252,255,0.10)', 'rgba(252,252,255,0.04)', 'rgba(0,0,0,0)'] as const,
  gloss:       ['rgba(252,252,255,0.10)', 'rgba(252,252,255,0)'] as const,
  // Prism gradient — the chromatic edge ring (cyan→magenta→gold)
  prism:       [colors.prismCyan, colors.prismMagenta, colors.prismGold] as const,
  prismSoft:   [colors.prismCyanSoft, colors.prismMagentaSoft, colors.prismGoldSoft] as const,
  // Spectrum bar — celebratory chromatic band shown in the dab window
  spectrum:    ['rgba(58,205,240,0)', colors.prismCyan, colors.prismMagenta, colors.prismGold, 'rgba(240,214,112,0)'] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// Spacing rhythm
// ─────────────────────────────────────────────────────────────────────────────
export const spacing = {
  unit: 4,
  xs: 8,
  sm: 16,
  md: 32,
  elementGap: 24,
  containerPadding: 40,
  lg: 64,
  xl: 128,
  xxl: 48,
} as const;

export const radius = {
  sm: 8, md: 16, lg: 32, xl: 48, full: 9999,
} as const;

// On a deep cool-purple background, shadow color is functionally near-black —
// kept as #000 so elevated components read as a clean cut-out.
const SHADOW_COLOR = '#000000';

export const shadow = {
  color: SHADOW_COLOR,
  card: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  orb: {
    shadowColor: colors.prismCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 16,
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
  // display-lg: 48px Geist Light · -0.04em tracking · 1.1 line-height
  display: {
    fontFamily: 'Geist_300Light',
    fontSize: 48,
    letterSpacing: -1.92,
    lineHeight: 53,
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
  bodyLg: {
    fontFamily: 'Geist_300Light',
    fontSize: 18,
    lineHeight: 26,
  },
  body: {
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    lineHeight: 26,
  },
  dataValue: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 14,
    lineHeight: 20,
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
    tap:        160,
    tooltip:    180,
    popover:    220,
    modal:      240,
    instant:    150,
    quick:      200,
    base:       400,
    smooth:     600,
    enter:      480,
    deliberate: 800,
    slow:       900,
  },
  exit: {
    tap:        100,
    tooltip:    140,
    popover:    160,
    modal:      180,
  },
  easing: {
    easeOut:   [0.22, 1, 0.36, 1] as const,
    easeInOut: [0.77, 0, 0.175, 1] as const,
    drawer:    [0.32, 0.72, 0, 1] as const,
    swoop:     [0.22, 1, 0.36, 1] as const,
    // index.html ease curves
    spring:    [0.22, 1.4, 0.36, 1] as const,    // --ease-spring
    quartz:    [0.16, 0.84, 0.24, 1] as const,   // --ease-quartz
    mercury:   [0.7, 0, 0.3, 1] as const,        // --ease-mercury
  },
} as const;

export const reanimatedEasing = {
  easeOut:   Easing.bezier(...motion.easing.easeOut),
  easeInOut: Easing.bezier(...motion.easing.easeInOut),
  drawer:    Easing.bezier(...motion.easing.drawer),
  spring:    Easing.bezier(...motion.easing.spring),
  quartz:    Easing.bezier(...motion.easing.quartz),
  mercury:   Easing.bezier(...motion.easing.mercury),
};

export const animation = {
  shimmerDurationMs: 4200,
  pulseDurationMs:   1400,
  prismDriftMs:      9000, // matches index.html prism-drift @ 9s
  pressSpring:  { damping: 14, stiffness: 220, mass: 0.6 },
  toggleSpring: { damping: 15, stiffness: 260, mass: 0.5 },
  thumbSpring:  { damping: 18, stiffness: 200, mass: 0.7 },
  toastSpring:  { damping: 22, stiffness: 200, mass: 0.9 },
  orbSpring:    { damping: 18, stiffness: 140, mass: 1.0 },
  orbitDurationMs: 30000,
};
