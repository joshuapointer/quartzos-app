import { Dimensions } from 'react-native';
import { Easing } from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export { SCREEN_W, SCREEN_H };

// ─────────────────────────────────────────────────────────────────────────────
// design.md — Quartzie · OLED White-Hot Neon Edge (may 2026)
// Single source of truth. All consumer aliases below resolve to these values.
// Heat is encoded by white intensity / glow strength; cool by quartz cyan.
// ─────────────────────────────────────────────────────────────────────────────
export const colors = {
  // ── Core backgrounds (OLED — pure black) ──
  background:              '#000000',
  surface:                 '#000000',
  surfaceDim:              '#000000',

  // ── Surface container ramp (graphite scale) ──
  surfaceContainerLowest:  '#000000',
  surfaceContainerLow:     '#0a0a0a',
  surfaceContainer:        '#111111',
  surfaceContainerHigh:    '#181818',
  surfaceContainerHighest: '#1f1f1f',
  surfaceVariant:          '#1f1f1f',

  // ── Numeric ramp (legacy aliases) ──
  bgDeep:        '#000000',
  surface1:      '#000000',
  surface2:      '#0a0a0a',
  surface3:      '#111111',
  surface4:      '#181818',
  surface5:      '#1f1f1f',
  surface6:      '#262626',
  surfaceBright: '#262626',

  // ── Typography on dark surfaces (white grayscale ramp) ──
  onBackground:      '#ffffff',
  onSurface:         '#ffffff',
  onSurfaceVariant:  '#a0a0a0',

  // ── Bone (warm-neutral typography ramp — now neutral grayscale) ──
  bone100: '#ffffff',
  bone90:  '#d4d4d4',
  bone70:  '#a0a0a0',
  bone50:  '#666666',
  bone35:  '#444444',
  bone20:  '#222222',

  // ── Primary (white-hot — heat is intensity, not hue) ──
  primary:                '#ffffff',
  onPrimary:              '#000000',
  primaryContainer:       '#e6e6e6',
  onPrimaryContainer:     '#000000',
  primaryFixed:           '#ffffff',
  primaryFixedDim:        '#ffffff',
  onPrimaryFixed:         '#000000',
  onPrimaryFixedVariant:  '#222222',

  // ── Secondary (muted cool grey-blue, unchanged) ──
  secondary:                '#c1c6d5',
  onSecondary:              '#2b313c',
  secondaryContainer:       '#414753',
  onSecondaryContainer:     '#b0b5c3',
  secondaryFixed:           '#dde2f1',
  secondaryFixedDim:        '#c1c6d5',
  onSecondaryFixed:         '#161c26',
  onSecondaryFixedVariant:  '#414753',

  // ── Tertiary (Quartz / cool blue, unchanged) ──
  tertiary:                '#95ccff',
  onTertiary:              '#003352',
  tertiaryContainer:       '#00a8ff',
  onTertiaryContainer:     '#003a5c',
  tertiaryFixed:           '#cde5ff',
  tertiaryFixedDim:        '#95ccff',
  onTertiaryFixed:         '#001d32',
  onTertiaryFixedVariant:  '#004a75',

  // ── Outlines & error ──
  outline:           '#666666',
  outlineVariant:    '#222222',
  error:             '#ff5252',
  onError:           '#000000',
  errorContainer:    '#330000',
  onErrorContainer:  '#ffd6d6',

  // ── Ember semantic ramp (heat states — now white intensity ramp) ──
  emberBright:  '#ffffff',
  ember:        '#e6e6e6',
  emberDeep:    '#1a1a1a',
  emberMid:     '#888888',
  emberCool:    '#5fa8d4',

  // ── Quartz semantic ramp (unchanged) ──
  quartzBright: '#95ccff',
  quartz:       '#00a8ff',
  quartzDeep:   '#004a75',
  quartzDim:    '#3884b8',

  // ── Brass (custom preset accent — non-orange olive-gold, retained) ──
  brass: '#C4AC54',

  // ── amberGold rebound to white (was BangerAnatomy active fill) ──
  amberGold: '#ffffff',

  // ── Inner lens colors (TempDial) ──
  lensIdle:    '#0a0a0a',
  lensHeating: '#1a1a1a',
  lensTarget:  '#2a2a2a',
  lensCooling: '#0a1218',
  lensDunk:    '#0c2640',

  // ── Semantic ──
  warning: '#ffd60a',
  success: '#7EC8A0',

  // ── Backward-compat aliases (rebound to OLED palette) ──
  inversePrimary:    '#000000',
  glassFill:         'rgba(0,0,0,0.6)',
  glassBorder:       'rgba(255,255,255,0.10)',
  heatIdle:          '#95ccff',
  heatAmber:         '#e6e6e6',
  heatGlow:          '#ffffff',
  heatCyan:          '#00a8ff',
  heatCooling:       '#5fa8d4',
  ruby:      '#ff5252',
  amethyst:  '#95ccff',
  emerald:   '#7EC8A0',
  sapphire:  '#00a8ff',
  citrine:   '#C4AC54',
  idleDeep:      '#000000',
  textPrimary:   '#ffffff',
  textSecondary: '#a0a0a0',
  textDim:       '#444444',
  crystalEdge:   'rgba(255,255,255,0.10)',
  glassDeep:     'rgba(0,0,0,0.6)',
  activeAmber:   '#ffffff',
  activeGlow:    '#ffffff',
  activeDark:    '#1a1a1a',

  // ── Semantic aliases (camelCase versions) ──
  voidObsidian:  '#000000',
  surfaceDeep:   '#000000',
  surfaceMid:    '#0a0a0a',
  surfaceRaised: '#181818',
  surfaceMuted:  '#1f1f1f',
  warmBone:      '#ffffff',
  boneMid:       '#d4d4d4',
  boneDim:       '#666666',
  boneGhost:     '#444444',
  firedAmber:    '#ffffff',
  emberGlow:     '#ffffff',
  coldSlate:     '#95ccff',
  quartzMid:     '#00a8ff',
};

export const gradients = {
  background:  ['#000000', '#000000', '#000000'] as const,
  ember:       ['#ffffff', '#cccccc', '#222222'] as const,
  quartz:      ['#95ccff', '#00a8ff', '#004a75'] as const,
  heatCore:    ['rgba(255,255,255,0)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.45)'] as const,
  cardActive:   ['#1a1a1a', '#000000'] as const,
  cardInactive: ['#0a0a0a', '#000000'] as const,
  cardNeutral:  ['#0a0a0a', '#000000'] as const,
  amethyst:    ['#95ccff', '#00a8ff', '#004a75'] as const,
  primary:     ['#ffffff', '#cccccc', '#222222'] as const,
  secondary:   ['#95ccff', '#00a8ff', '#004a75'] as const,
  wordmark:    ['#ffffff', '#d4d4d4'] as const,
  crystal:     ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0)'] as const,
  gloss:       ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)'] as const,
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

// On OLED black, shadow color is functionally invisible — kept at pure black
// so any elevated component reads as a clean cut-out rather than a tinted halo.
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
    shadowColor: '#ffffff',
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
// Easing curves follow Emil Kowalski's principle: UI animations belong under
// 300ms and exits should be snappier than enters. The bezier tuples here are
// bridged to Reanimated via `reanimatedEasing` below — use that at callsites.
export const motion = {
  duration: {
    // UI-class ramp (Emil: UI animations under 300ms)
    tap:        160,  // button press feedback
    tooltip:    180,  // small popovers
    popover:    220,  // dropdowns, list-row enters
    modal:      240,  // modals, sheets, stage transitions
    // Legacy keys preserved for backward-compat (migrate in US-002)
    instant:    150,
    quick:      200,
    base:       400,
    smooth:     600,
    enter:      480,
    deliberate: 800,
    slow:       900,
  },
  // Asymmetric exits — snappier than enters (Emil: "exits should be snappy")
  exit: {
    tap:        100,
    tooltip:    140,
    popover:    160,
    modal:      180,
  },
  easing: {
    easeOut:   [0.22, 1, 0.36, 1] as const,    // strong ease-out for enters/exits
    easeInOut: [0.77, 0, 0.175, 1] as const,   // strong ease-in-out for on-screen movement
    drawer:    [0.32, 0.72, 0, 1] as const,    // Ionic/iOS drawer / sheet curve
    swoop:     [0.22, 1, 0.36, 1] as const,    // backward-compat alias for easeOut
  },
} as const;

// Reanimated bridge — use these at callsites instead of inlining Easing.bezier(...).
export const reanimatedEasing = {
  easeOut:   Easing.bezier(...motion.easing.easeOut),
  easeInOut: Easing.bezier(...motion.easing.easeInOut),
  drawer:    Easing.bezier(...motion.easing.drawer),
};

export const animation = {
  shimmerDurationMs: 4200,
  pulseDurationMs:   1400,
  pressSpring:  { damping: 14, stiffness: 220, mass: 0.6 },
  toggleSpring: { damping: 15, stiffness: 260, mass: 0.5 },
  thumbSpring:  { damping: 18, stiffness: 200, mass: 0.7 },
  toastSpring:  { damping: 22, stiffness: 200, mass: 0.9 },
  orbitDurationMs: 30000,
};
