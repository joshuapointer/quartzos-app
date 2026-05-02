import { Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export { SCREEN_W, SCREEN_H };

// ─────────────────────────────────────────────────────────────────────────────
// design.md — Quartzie · Warm Obsidian Palette (apr 2026)
// Single source of truth. All consumer aliases below resolve to these values.
// ─────────────────────────────────────────────────────────────────────────────
export const colors = {
  // ── Core backgrounds (warm espresso / obsidian) ──
  background:              '#1c110a',
  surface:                 '#1c110a',
  surfaceDim:              '#1c110a',
  // surfaceBright defined below as the brightest container

  // ── Surface container ramp ──
  surfaceContainerLowest:  '#160c06',
  surfaceContainerLow:     '#251912',
  surfaceContainer:        '#291d16',
  surfaceContainerHigh:    '#35271f',
  surfaceContainerHighest: '#40322a',
  surfaceVariant:          '#40322a',

  // ── Numeric ramp (legacy — many components reference surface1..surface6) ──
  bgDeep:        '#1c110a',  // ↔ background
  surface1:      '#160c06',  // ↔ surfaceContainerLowest
  surface2:      '#251912',  // ↔ surfaceContainerLow
  surface3:      '#291d16',  // ↔ surfaceContainer
  surface4:      '#35271f',  // ↔ surfaceContainerHigh
  surface5:      '#40322a',  // ↔ surfaceContainerHighest
  surface6:      '#45362e',  // ↔ surfaceBright (new — slightly brighter than highest)
  surfaceBright: '#45362e',

  // ── Typography on dark surfaces ──
  onBackground:      '#f6ded2',
  onSurface:         '#f6ded2',
  onSurfaceVariant:  '#e0c0af',

  // ── Bone (warm neutral typography ramp; aligned to on-surface family) ──
  bone100: '#f6ded2',  // ↔ onSurface
  bone90:  '#ecceb9',
  bone70:  '#e0c0af',  // ↔ onSurfaceVariant
  bone50:  '#a78b7c',  // ↔ outline
  bone35:  '#7a5c4b',
  bone20:  '#584235',  // ↔ outlineVariant

  // ── Primary (Ember / warm) ──
  primary:                '#ffb68b',
  onPrimary:              '#522300',
  primaryContainer:       '#ff7a00',
  onPrimaryContainer:     '#5c2800',
  primaryFixed:           '#ffdbc8',
  primaryFixedDim:        '#ffb68b',
  onPrimaryFixed:         '#321200',
  onPrimaryFixedVariant:  '#753400',

  // ── Secondary (muted cool grey-blue) ──
  secondary:                '#c1c6d5',
  onSecondary:              '#2b313c',
  secondaryContainer:       '#414753',
  onSecondaryContainer:     '#b0b5c3',
  secondaryFixed:           '#dde2f1',
  secondaryFixedDim:        '#c1c6d5',
  onSecondaryFixed:         '#161c26',
  onSecondaryFixedVariant:  '#414753',

  // ── Tertiary (Quartz / cool blue) ──
  tertiary:                '#95ccff',
  onTertiary:              '#003352',
  tertiaryContainer:       '#00a8ff',
  onTertiaryContainer:     '#003a5c',
  tertiaryFixed:           '#cde5ff',
  tertiaryFixedDim:        '#95ccff',
  onTertiaryFixed:         '#001d32',
  onTertiaryFixedVariant:  '#004a75',

  // ── Outlines & error ──
  outline:           '#a78b7c',
  outlineVariant:    '#584235',
  error:             '#ffb4ab',
  onError:           '#690005',
  errorContainer:    '#93000a',
  onErrorContainer:  '#ffdad6',

  // ── Ember semantic ramp (heat states) ──
  emberBright:  '#ffb68b',  // ↔ primary           (at-target)
  ember:        '#ff7a00',  // ↔ primaryContainer  (heating)
  emberDeep:    '#5c2800',  // ↔ onPrimaryContainer (deep heat)
  emberMid:     '#a04e00',  // heating ring (dim)
  emberCool:    '#b86838',  // cooling ring

  // ── Quartz semantic ramp (cool / dunk states) ──
  quartzBright: '#95ccff',  // ↔ tertiary       (dunk ready)
  quartz:       '#00a8ff',  // ↔ tertiaryContainer
  quartzDeep:   '#004a75',  // ↔ onTertiaryFixedVariant
  quartzDim:    '#3884b8',  // idle ring

  // ── Brass (custom preset accent) ──
  brass: '#C4AC54',

  // Goldener mid-amber — used where the "fire/heat" semantic must read as
  // saturated gold rather than the pinker firedAmber. Currently consumed by
  // BangerAnatomy's active wall-thickness zone fill.
  amberGold: '#e89240',

  // ── Inner lens colors (TempDial) ──
  lensIdle:    '#1a2740',
  lensHeating: '#3a1a08',
  lensTarget:  '#5c2800',
  lensCooling: '#3e2212',
  lensDunk:    '#0c2640',

  // ── Semantic ──
  warning: '#ffb68b',
  success: '#7EC8A0',

  // ── Backward-compat aliases (referenced widely; map to new palette) ──
  inversePrimary:    '#5c2800',
  glassFill:         'rgba(28,17,10,0.6)',
  glassBorder:       'rgba(246,222,210,0.08)',
  heatIdle:          '#95ccff',
  heatAmber:         '#ff7a00',
  heatGlow:          '#ff7a00',
  heatCyan:          '#00a8ff',
  heatCooling:       '#b86838',
  ruby:      '#ffb4ab',
  amethyst:  '#95ccff',
  emerald:   '#7EC8A0',
  sapphire:  '#00a8ff',
  citrine:   '#C4AC54',
  idleDeep:      '#160c06',
  textPrimary:   '#f6ded2',
  textSecondary: '#e0c0af',
  textDim:       '#7a5c4b',
  crystalEdge:   'rgba(246,222,210,0.08)',
  glassDeep:     'rgba(28,17,10,0.6)',
  activeAmber:   '#ff7a00',
  activeGlow:    '#ff7a00',
  activeDark:    '#ff7a00',

  // ── Semantic aliases (camelCase versions of design.md tokens) ──
  voidObsidian:  '#160c06',  // surface-container-lowest = the void
  surfaceDeep:   '#160c06',
  surfaceMid:    '#291d16',
  surfaceRaised: '#35271f',
  surfaceMuted:  '#40322a',
  warmBone:      '#f6ded2',
  boneMid:       '#e0c0af',
  boneDim:       '#a78b7c',
  boneGhost:     '#7a5c4b',
  firedAmber:    '#ffb68b',
  emberGlow:     '#ff7a00',
  coldSlate:     '#95ccff',
  quartzMid:     '#00a8ff',
};

export const gradients = {
  // top → bottom vignette: deep low surface fades into the void
  background:  ['#251912', '#1c110a', '#160c06'] as const,
  ember:       ['#ffb68b', '#ff7a00', '#5c2800'] as const,
  quartz:      ['#95ccff', '#00a8ff', '#004a75'] as const,
  heatCore:    ['rgba(255,122,0,0)', 'rgba(255,122,0,0.25)', 'rgba(255,182,139,0.5)'] as const,
  // Card surface gradients — use via SurfaceCard component
  cardActive:   ['#2a1a10', '#160c06'] as const,  // active preset, highlighted rows
  cardInactive: ['#1c110a', '#160c06'] as const,  // non-active items in a list
  cardNeutral:  ['#1f130c', '#160c06'] as const,  // config sections, history cards
  // legacy aliases
  amethyst:    ['#95ccff', '#00a8ff', '#004a75'] as const,
  primary:     ['#ffb68b', '#ff7a00', '#5c2800'] as const,
  secondary:   ['#95ccff', '#00a8ff', '#004a75'] as const,
  wordmark:    ['#f6ded2', '#e0c0af'] as const,
  crystal:     ['rgba(246,222,210,0.08)', 'rgba(246,222,210,0.02)', 'rgba(28,17,10,0)'] as const,
  gloss:       ['rgba(246,222,210,0.08)', 'rgba(246,222,210,0)'] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// design.md — spacing rhythm
//   unit 4 · xs 8 · sm 16 · md 32 · lg 64 · xl 128 · element-gap 24 · container-padding 40
// Numeric in px. Existing semantic names preserved for back-compat consumers.
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

// Shadow color tints toward warm-obsidian (the void) instead of pure black —
// a brand-tinted shadow keeps every elevated surface inside the warm world.
const SHADOW_COLOR = '#160c06';

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
    shadowColor: '#ff7a00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
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
// design.md typography — Geist for display/body, Geist Mono for data/labels.
// Expo Google Fonts ships per-weight families; use the explicit family name and
// omit fontWeight so iOS/Android resolve identically.
// ─────────────────────────────────────────────────────────────────────────────
export const fonts = {
  // display-lg: 48px Light · -0.04em tracking · 1.1 line-height
  display: {
    fontFamily: 'Geist_300Light',
    fontSize: 48,
    letterSpacing: -1.92,   // -0.04em * 48
    lineHeight: 53,         // 1.1 * 48
  },
  // headline-md: 24px Regular · -0.02em tracking · 1.2 line-height
  h1: {
    fontFamily: 'Geist_400Regular',
    fontSize: 32,
    letterSpacing: -0.64,
    lineHeight: 38,
  },
  h2: {
    fontFamily: 'Geist_400Regular',
    fontSize: 24,
    letterSpacing: -0.48,   // -0.02em * 24
    lineHeight: 29,         // 1.2 * 24
  },
  // body-main: 16px Regular · 1.6 line-height
  bodyLg: {
    fontFamily: 'Geist_300Light',
    fontSize: 18,
    lineHeight: 26,
  },
  body: {
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    lineHeight: 26,         // 1.6 * 16
  },
  // data-value: 14px Regular Mono · 1.4 line-height
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
  // data-label: 12px Medium Mono · 0.1em tracking · uppercase
  dataLabel: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 12,
    letterSpacing: 1.2,     // 0.1em * 12
    lineHeight: 12,
    textTransform: 'uppercase' as const,
  },
  labelCaps: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase' as const,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// design.md motion tokens — durations and easings.
// ─────────────────────────────────────────────────────────────────────────────
export const motion = {
  duration: {
    instant:    150,
    quick:      200,
    base:       400,
    smooth:     600,
    enter:      480,
    deliberate: 800,
    slow:       900,
  },
  easing: {
    swoop:    [0.22, 1, 0.36, 1] as const,  // cubic-bezier(0.22, 1, 0.36, 1)
  },
} as const;

export const animation = {
  shimmerDurationMs: 4200,
  pulseDurationMs:   1400,
  pressSpring:  { damping: 14, stiffness: 220, mass: 0.6 },
  toggleSpring: { damping: 15, stiffness: 260, mass: 0.5 },
  thumbSpring:  { damping: 18, stiffness: 200, mass: 0.7 },
  orbitDurationMs: 30000,
};
