import { Easing } from 'react-native-reanimated';

// ─────────────────────────────────────────────────────────────────────────────
// Shatterbox — amber-glass / underground (May 2026 — replaces Molten Refresh)
//
// Source of truth: shatterbox/brand-spec.md
//
// Single-axis palette:
//   1. Ink obsidian backgrounds — basement floor, never pure black
//   2. Bone neutrals — warm-white ramp for typography on dark surfaces
//   3. Amber — the ONE neon. Reserved for the active button + one data point
//      per screen (a temperature, an ID, a status pill). Everything else
//      is bone or muted gold.
//
// React Native cannot consume oklch() directly; the hex values below are
// perceptual approximations of the spec's oklch sources, kept in
// /* oklch(...) */ comments for reference + future Skia migration.
// ─────────────────────────────────────────────────────────────────────────────
export const colors = {
  // ── Core backgrounds (ink obsidian) ──
  background:              '#1a1410', /* oklch(0.15 0.014 60) — basement floor */
  surface:                 '#241c15', /* oklch(0.20 0.022 62) — lifted card    */

  // ── Surface container ramp ──
  surfaceContainerHigh:    '#2e251c',

  // ── Numeric ramp (back-compat — consumed via ThemeColors) ──
  bgDeep:        '#1a1410',
  surface1:      '#1f1812',
  surface3:      '#241c15',
  surface6:      '#2e251c',
  surfaceBright: '#2e251c',

  // ── Typography on dark surfaces ──
  onBackground:      '#f5edd9', /* bone ≈ oklch(0.96 0.024 78) */
  onSurface:         '#f5edd9',
  onSurfaceVariant:  '#b8a685', /* muted gold ≈ oklch(0.70 0.05 70) */

  // ── Bone neutral ramp (warm-white) ──
  bone100: '#f5edd9',
  bone90:  '#e8dcc0',
  bone80:  '#d6c89f',
  bone70:  '#c8b888',
  bone60:  '#b8a685',
  bone50:  '#a39474',
  bone40:  '#8b7e64',
  bone35:  '#736755',
  bone25:  '#5a5045',
  bone20:  '#4a3826',

  // ── Amber single-accent ──
  // Spec: at most twice per screen — primary action + one piece of data.
  // The prism* aliases are retained for API stability but all map to the
  // same amber value; chromatic split is dead.
  prismCyan:        '#f5a44a',
  prismMagenta:     '#f5a44a',
  prismGold:        '#f5a44a',

  // ── Primary semantic ──
  primary:                '#f5a44a', /* amber */
  onPrimary:              '#1a1410',
  primaryContainer:       '#b06832', /* deep amber — pressed/glow base */
  onPrimaryContainer:     '#f5edd9',

  // ── Secondary (muted bone) ──
  secondary:                '#b8a685',
  onSecondary:              '#241c15',
  secondaryContainer:       '#4a3826',
  onSecondaryContainer:     '#d6c89f',

  // ── Tertiary (deep amber for non-primary accent consumers) ──
  tertiary:                '#b06832',
  onTertiary:              '#1a1410',
  tertiaryContainer:       '#3a261a',
  onTertiaryContainer:     '#f5a44a',

  // ── Outlines & error ──
  outline:           '#4a3826',
  outlineVariant:    '#3a261a',
  error:             '#ff6b6b',
  onError:           '#330000',
  errorContainer:    '#5a0a0a',
  onErrorContainer:  '#ffd6d6',

  // ── Ember semantic ramp (back-compat — consumed by QWordmark/color-picker) ──
  emberBright:  '#f5a44a',
  emberDeep:    '#1a1410',

  // ── Quartz semantic ramp (back-compat — consumed by QWordmark, color-picker) ──
  // Routed to amber in the shatterbox register; cool-blue split is dead.
  quartzBright: '#f5a44a',
  quartzDim:    '#b06832',

  // ── Brass (custom preset accent) ──
  brass: '#b8a685',

  // ── Semantic ──
  warning: '#f5a44a',
  success: '#7EC8A0',

  // ── Matte surface tints (was glass — now opaque ink/surface values).
  // Anti-slop spec: "no glassmorphism / frosted blur. Borders are hard,
  // surfaces are matte." Kept under glass* names for back-compat consumers
  // but they no longer carry alpha channels meant for BlurView.
  glassThin:        '#1f1812',
  glassThick:       '#241c15',
  glassPane:        '#241c15',
  glassEdge:        '#4a3826',
  glassEdgeStrong:  '#736755',
  glassEdgeFaint:   '#3a261a',

  // ── Text shadow / glyph helpers ──
  textShadowDark: 'rgba(0,0,0,0.7)',

  // ── Orb chromatic fringe — collapsed to the amber/deep-amber pair ──
  fringePos: '#f5a44a',
  fringeNeg: '#b06832',

  // ── Orb outline fallback ──
  orbOutlineDefault: '#f5edd9',

  // ── Glass + text aliases (consumed by ThemeColors, settings, color-picker, onboarding) ──
  glassFill:         '#241c15',
  glassBorder:       '#4a3826',
  textPrimary:   '#f5edd9',
  textSecondary: '#b8a685',
  textDim:       '#8b7e64',

  // ── Background haze tokens — collapsed to opaque ink so the body
  // background reads as engraved metal, not a multi-radial bloom. Anti-slop
  // forbids the cyan/magenta dual-radial of the molten refresh.
  bgHazeCyan:       'rgba(74, 56, 38, 0.40)',  /* deep amber haze */
  bgHazeMagenta:    'rgba(74, 56, 38, 0.30)',  /* same — paired field is dead */
  bgCenterBloom:    'rgba(245, 164, 74, 0.06)', /* faint amber bloom */

  // ── Semantic aliases (camelCase) ──
  voidObsidian:  '#1a1410',
  surfaceMid:    '#241c15',
  surfaceRaised: '#2e251c',
  warmBone:      '#f5edd9',
  boneMid:       '#d6c89f',
  boneDim:       '#8b7e64',
  boneGhost:     '#5a5045',
  firedAmber:    '#f5a44a',
  emberGlow:     '#b06832',
  coldSlate:     '#b8a685',
  quartzMid:     '#b06832',
};

// ─────────────────────────────────────────────────────────────────────────────
// Prism (legacy export name) — every stop now points at amber. Spec: single
// neon, no chromatic split.
// ─────────────────────────────────────────────────────────────────────────────
export const prism = {
  cyan:        colors.prismCyan,
  magenta:     colors.prismMagenta,
  gold:        colors.prismGold,
  cyanSoft:    'rgba(245, 164, 74, 0.55)',
  magentaSoft: 'rgba(245, 164, 74, 0.55)',
  goldSoft:    'rgba(245, 164, 74, 0.55)',
  gradient:     [colors.prismCyan, colors.prismMagenta, colors.prismGold] as const,
  gradientSoft: ['rgba(245, 164, 74, 0.55)', 'rgba(245, 164, 74, 0.55)', 'rgba(245, 164, 74, 0.55)'] as const,
  driftDurationMs: 9000,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Glass — name preserved, semantics flipped to opaque matte values. Any
// remaining BlurView consumer should be deleted; these tokens no longer
// carry the alpha needed for a frosted effect.
// ─────────────────────────────────────────────────────────────────────────────
export const glass = {
  thin:        colors.glassThin,
  thick:       colors.glassThick,
  pane:        colors.glassPane,
  edge:        colors.glassEdge,
  edgeStrong:  colors.glassEdgeStrong,
} as const;

export const gradients = {
  // Heat core: faint amber → solid amber, the only legal radial in this register
  heatCore:    ['rgba(245, 164, 74, 0)', 'rgba(245, 164, 74, 0.25)', 'rgba(245, 164, 74, 0.55)'] as const,
  cardNeutral: ['#241c15', '#1f1812'] as const,
  secondary:   ['#b8a685', '#8b7e64', '#5a5045'] as const,
  // Gloss is dead in matte register — single bone overlay, near-transparent
  gloss:       ['rgba(245, 237, 217, 0.06)', 'rgba(245, 237, 217, 0)'] as const,
  // Spectrum was the chromatic split — collapsed to a single amber band
  spectrum:    ['rgba(245, 164, 74, 0)', '#f5a44a', '#f5a44a', '#f5a44a', 'rgba(245, 164, 74, 0)'] as const,
  // Banger card photo placeholder — ink shards only
  photoPlaceholder: ['rgba(58, 38, 26, 0.45)', 'rgba(36, 28, 21, 0.30)', 'rgba(26, 20, 16, 0.55)'] as const,
  // Concentrate tile bottom fade
  tileShadeBottom: ['transparent', 'rgba(0,0,0,0.78)'] as const,
  // Recents row preset card top region
  presetCardTop: ['#3a261a', '#1a1410'] as const,
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

// ─────────────────────────────────────────────────────────────────────────────
// Engraved geometry — no pills. Spec: cards 4px, buttons/chips 2px, hairlines 0px.
// `full` (was 9999) collapses to 2 so legacy consumers reading `radius.full`
// render as engraved chips.
// ─────────────────────────────────────────────────────────────────────────────
export const radius = {
  sm: 2, md: 4, lg: 4, xl: 4, full: 2,
} as const;

// On a deep ink background, shadow color stays neutral black per spec
// ("cast shadows are downward, hard, neutral black for elevation").
const SHADOW_COLOR = '#000000';

export const shadow = {
  card: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.5,
    shadowRadius: 36,
    elevation: 12,
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
//   Display: Bebas Neue — UPPERCASE condensed-black headlines, big numbers
//   Body:    JetBrains Mono — clipped, terminal-y body copy
//   Data:    JetBrains Mono Medium with tabular numerics, rendered amber
//
// Italic does not exist in this system (spec). Anything that previously
// used Instrument Serif Italic is replaced with Bebas Neue.
// ─────────────────────────────────────────────────────────────────────────────
export const fonts = {
  // display headline — was 96px Instrument Serif Italic, now Bebas Neue
  serifDisplay: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 96,
    letterSpacing: 0.576,   // +0.6% * 96
    lineHeight: 96,
  },
  // headline-mid — was Instrument Serif Italic 26px
  serifHeadline: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 26,
    letterSpacing: 0.156,   // +0.6% * 26
    lineHeight: 31,
  },
  // card name — was Instrument Serif Italic 18px
  serifCard: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    letterSpacing: 0.108,
    lineHeight: 19,
  },
  // headline-md
  h1: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 32,
    letterSpacing: 0.192,
    lineHeight: 38,
  },
  h2: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    letterSpacing: 0.144,
    lineHeight: 29,
  },
  body: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 16,
    lineHeight: 26,
  },
  caption: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 12,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  dataLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12,
    textTransform: 'uppercase' as const,
  },
  labelCaps: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase' as const,
  },
  // mono-eyebrow: 9px caps · 0.28em tracking — picker meta, eyebrows
  monoEyebrow: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 9,
    letterSpacing: 2.52,
    lineHeight: 12,
    textTransform: 'uppercase' as const,
  },
  // mono-chip: 9.5px caps · 0.20em tracking — status chip
  monoChip: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 9.5,
    letterSpacing: 1.9,
    lineHeight: 12,
    textTransform: 'uppercase' as const,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Motion tokens — clipped per spec. ≤120ms linear opacity for transitions.
// ─────────────────────────────────────────────────────────────────────────────
export const motion = {
  duration: {
    tap:     120,
    popover: 120,
    base:    200,
  },
  exit: {
    tap:     100,
    popover: 120,
  },
  easing: {
    easeOut: [0.22, 1, 0.36, 1] as const,
    swoop:   [0.22, 1, 0.36, 1] as const,
    quartz:  [0.16, 0.84, 0.24, 1] as const,
  },
} as const;

export const reanimatedEasing = {
  easeOut: Easing.bezier(...motion.easing.easeOut),
  quartz:  Easing.bezier(...motion.easing.quartz),
};

export const animation = {
  prismDriftMs:      9000, // legacy export name; chromatic drift is dead
  pressSpring:  { damping: 14, stiffness: 220, mass: 0.6 },
  toggleSpring: { damping: 15, stiffness: 260, mass: 0.5 },
  thumbSpring:  { damping: 18, stiffness: 200, mass: 0.7 },
  toastSpring:  { damping: 22, stiffness: 200, mass: 0.9 },
  orbSpring:         { damping: 18, stiffness: 140, mass: 1.0 },
  orbPositionSpring: { damping: 18, stiffness: 110, mass: 1 },
};
