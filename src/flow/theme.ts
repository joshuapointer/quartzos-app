/**
 * src/flow/theme.ts
 * Design tokens for the linear flow.
 * Aligned to /design.md (may 2026) — OLED · white-hot neon edge.
 * Key naming retained (`navy`, `bone`, `ember`, `quartz`) for back-compat;
 * values resolve to pure-black surfaces, white-intensity heat ramp,
 * and the unchanged quartz cyan cool ramp.
 */

import { reanimatedEasing } from '@/design/tokens';

export const THEME = {
  // "navy" key kept for back-compat — values are pure-black ramp on OLED.
  navy: {
    0: '#000000',  // surface-container-lowest (the void)
    1: '#000000',  // background
    2: '#0a0a0a',  // surface-container-low
    3: '#111111',  // surface-container
    4: '#1f1f1f',  // surface-container-highest
    5: '#262626',  // surface-bright
  },
  bone: {
    100: '#ffffff',  // on-surface
    90:  '#d4d4d4',
    70:  '#a0a0a0',  // on-surface-variant
    50:  '#666666',  // outline
    35:  '#444444',
    20:  '#222222',  // outline-variant
    warm04: 'rgba(255, 255, 255, 0.04)',
    warm08: 'rgba(255, 255, 255, 0.08)',
    warm10: 'rgba(255, 255, 255, 0.10)',
    warm18: 'rgba(255, 255, 255, 0.18)',
  },
  ember: {
    bright: '#ffffff',                     // primary (white-hot at-target)
    base:   '#e6e6e6',                     // primary-container (heating-dim)
    deep:   '#222222',                     // on-primary-container
    glow:   'rgba(255, 255, 255, 0.45)',   // primary-container at 45% alpha
  },
  quartz: {
    bright: '#95ccff',
    base:   '#00a8ff',
    deep:   '#004a75',
    glow:   'rgba(0, 168, 255, 0.30)',
  },
  danger: {
    base:  '#ff5252',
    deep:  '#c44444',
  },
  // Warning amber-yellow — the one warm hue that survives, distinct from
  // the (now white) ember at-target signal.
  warn:    '#ffd60a',
  success: '#7ec8a0',
} as const;

// Bare family names are kept only as semantic labels — never pass directly to
// fontFamily. Use the weight-suffixed Expo Google Fonts families in TYPE below
// (e.g. 'Geist_400Regular') so iOS and Android resolve identically.
export const FONTS = {
  sans: 'Geist_400Regular',
  mono: 'GeistMono_400Regular',
} as const;

/**
 * Cross-platform-safe TYPE tokens.
 * Use explicit weight-suffixed Expo font names (fontFamily) with no fontWeight,
 * so Android and iOS both resolve correctly — each registered weight is its own family.
 */
export const TYPE = {
  // display-lg per design.md: Geist Light, -0.04em tracking, 1.1 line-height
  display:    { fontFamily: 'Geist_300Light',    letterSpacing: -0.7, lineHeight: 1.1 },
  // headline-md per design.md: Geist Regular (400), -0.02em tracking
  headline:   { fontFamily: 'Geist_400Regular',  letterSpacing: -0.5 },
  body:       { fontFamily: 'Geist_400Regular' },
  bodyDim:    { fontFamily: 'Geist_400Regular',  color: '#666666' },
  mono:       { fontFamily: 'GeistMono_400Regular' },
  monoBright: { fontFamily: 'GeistMono_500Medium' },
  eyebrow:    {
    fontFamily:     'GeistMono_500Medium',
    fontSize:       9,
    letterSpacing:  2.88,
    textTransform:  'uppercase' as const,
    color:          '#666666',
  },
} as const;

// design.md radius scale plus flow-specific aliases (pill/card/hairline/disc)
export const RADIUS = {
  // design.md
  DEFAULT: 16,
  lg:      32,
  xl:      48,
  full:    9999,
  // flow aliases
  pill:     9999,
  card:     24,
  hairline: 1,
  disc:     9999,
} as const;

// SPACE is the canonical spacing scale for the linear flow (src/flow). The design.md 'spacing' ramp in src/design/tokens.ts is reserved for the second design system. Do not cross-import.
// Flow spacing scale. Existing keys (xs..xxxl) preserved at their original
// pixel values to avoid layout regressions in the linear flow. design.md
// spacing tokens (unit, elementGap, containerPadding, plus the canonical
// xs/sm/md/lg/xl ramp) are exposed alongside for new flow surfaces.
export const SPACE = {
  // flow legacy
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  32,
  xxxl: 48,
  // design.md
  unit:             4,
  elementGap:       24,
  containerPadding: 40,
} as const;

/** Animation durations in milliseconds — flow legacy + design.md motion */
export const DUR = {
  // flow legacy
  fast:  200,
  base:  380,
  view:  480,
  morph: 700,
  // design.md motion
  instant:    150,
  quick:      200,
  smooth:     600,
  enter:      480,
  deliberate: 800,
  slow:       900,
} as const;

/** Cubic-bezier for expo-style ease-out — matches CSS cubic-bezier(.22,1,.36,1) */
export const EASE_OUT_EXPO = {
  curve: [0.22, 1, 0.36, 1] as const,
} as const;

/**
 * SCREEN replaces inline magic numbers for layout geometry.
 * Note: the src/design/tokens.ts ramp belongs to the second design system —
 * do not import from there into src/flow.
 */
export const SCREEN = {
  HPAD:         22,
  BOTTOM:       80,
  PILL_RADIUS:  9999,
  CARD_RADIUS:  24,
  CARD_RADIUS_SM: 16,
  BADGE_RADIUS: 12,
  CARD_MAX:     320,
} as const;

/** Stagger-entrance motion constants for the linear flow. */
export const MOTION = {
  STAGGER_MS:        60,
  STAGGER_ENTER_DUR_MS: 600,
  STAGGER_EASE:      reanimatedEasing.easeOut,
} as const;
