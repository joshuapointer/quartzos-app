/**
 * src/flow/theme.ts
 * Design tokens for the linear flow.
 * Aligned to /design.md (apr 2026) — Quartzie warm obsidian palette.
 * Key naming retained (`navy`, `bone`, `ember`, `quartz`) for back-compat;
 * values now resolve to the warm-espresso/ember/quartz tokens.
 */

import { Easing } from 'react-native-reanimated';

export const THEME = {
  // "navy" key kept for back-compat — values are warm obsidian surface ramp.
  navy: {
    0: '#080503',  // surface-container-lowest (the void)
    1: '#0e0905',  // background
    2: '#251912',  // surface-container-low
    3: '#291d16',  // surface-container
    4: '#40322a',  // surface-container-highest
    5: '#45362e',  // surface-bright
  },
  bone: {
    100: '#f6ded2',  // on-surface
    90:  '#ecceb9',
    70:  '#e0c0af',  // on-surface-variant
    50:  '#a78b7c',  // outline
    35:  '#7a5c4b',
    20:  '#584235',  // outline-variant
    warm04: 'rgba(246, 222, 210, 0.04)',
    warm08: 'rgba(246, 222, 210, 0.08)',
    warm10: 'rgba(246, 222, 210, 0.10)',
    warm18: 'rgba(246, 222, 210, 0.18)',
  },
  ember: {
    bright: '#ffb68b',                    // primary
    base:   '#ff7a00',                    // primary-container
    deep:   '#5c2800',                    // on-primary-container
    glow:   'rgba(255, 122, 0, 0.45)',    // primary-container at 45% alpha
  },
  quartz: {
    bright: '#95ccff',                    // tertiary
    base:   '#00a8ff',                    // tertiary-container
    deep:   '#004a75',                    // on-tertiary-fixed-variant
    glow:   'rgba(0, 168, 255, 0.30)',    // tertiary-container at 30% alpha
  },
  danger: {
    base:  '#ffb4ab',
    deep:  '#c44444',
  },
  // Distinct from ember.bright (#ffb68b) — a warmer, more saturated amber
  // so a "+N°" warning reads differently than an active ember accent.
  warn:    '#ffa45c',
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
  bodyDim:    { fontFamily: 'Geist_400Regular',  color: '#a78b7c' },
  mono:       { fontFamily: 'GeistMono_400Regular' },
  monoBright: { fontFamily: 'GeistMono_500Medium' },
  eyebrow:    {
    fontFamily:     'GeistMono_500Medium',
    fontSize:       9,
    letterSpacing:  2.88,
    textTransform:  'uppercase' as const,
    color:          '#a78b7c',
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
  STAGGER_EASE:      Easing.bezier(0.22, 1, 0.36, 1),
} as const;
