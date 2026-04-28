/**
 * src/flow/theme.ts
 * Design tokens for the new linear flow — deep navy + Geist era.
 * Source of truth: /tmp/quartzie-prototype/src/styles.css
 *
 * oklch → sRGB conversion notes (all values stay within sRGB gamut):
 *   bone-70:  oklch(0.78 0.012 240) → #b8c0cc  (in-gamut)
 *   bone-50:  oklch(0.62 0.012 240) → #8a93a3  (in-gamut)
 *   bone-35:  oklch(0.45 0.012 240) → #5d6473  (in-gamut)
 *   bone-20:  oklch(0.30 0.010 240) → #3a3f4b  (in-gamut)
 *   ember-bright: oklch(0.78 0.20 55) → #ff9b3d  (CLIPPED — chroma 0.20 at L=0.78 exceeds sRGB; clipped to #ff9b3d)
 *   ember-base:   oklch(0.72 0.19 50) → #e3801f  (CLIPPED — clipped to #e3801f)
 *   ember-deep:   oklch(0.58 0.17 45) → #a85e1a  (in-gamut)
 *   quartz-bright: oklch(0.82 0.08 240) → #aac5e0  (in-gamut)
 *   quartz-base:   oklch(0.72 0.07 240) → #90aec9  (in-gamut)
 *   quartz-deep:   oklch(0.55 0.06 245) → #5d7388  (in-gamut)
 *   accent-amber:  oklch(0.82 0.20 55) → #ffae5a  (CLIPPED — clipped to #ffae5a)
 */

export const THEME = {
  navy: {
    0: '#050a14',
    1: '#081224',
    2: '#0c1a30',
    3: '#122439',
    4: '#1a3052',
  },
  bone: {
    100: '#f4f6fa',
    90:  '#e6ebf2',
    70:  '#b8c0cc',   // oklch(0.78 0.012 240)
    50:  '#8a93a3',   // oklch(0.62 0.012 240)
    35:  '#5d6473',   // oklch(0.45 0.012 240)
    20:  '#3a3f4b',   // oklch(0.30 0.010 240)
  },
  ember: {
    bright: '#ff9b3d',              // oklch(0.78 0.20 55) — sRGB clipped
    base:   '#e3801f',              // oklch(0.72 0.19 50) — sRGB clipped
    deep:   '#a85e1a',              // oklch(0.58 0.17 45)
    glow:   'rgba(227, 128, 31, 0.45)', // ember base at 45% alpha
  },
  quartz: {
    bright: '#aac5e0',              // oklch(0.82 0.08 240)
    base:   '#90aec9',              // oklch(0.72 0.07 240)
    deep:   '#5d7388',              // oklch(0.55 0.06 245)
    glow:   'rgba(144, 174, 201, 0.30)',
  },
  danger: '#e07070',
  warn:   '#e3a647',
  success: '#7ec8a0',
} as const;

export const FONTS = {
  sans: 'Geist',
  mono: 'GeistMono',
} as const;

/**
 * Cross-platform-safe TYPE tokens.
 * Use explicit weight-suffixed Expo font names (fontFamily) with no fontWeight,
 * so Android and iOS both resolve correctly — each registered weight is its own family.
 */
export const TYPE = {
  display:    { fontFamily: 'Geist_300Light',    letterSpacing: -0.7, lineHeight: 1.0 },
  headline:   { fontFamily: 'Geist_700Bold',     letterSpacing: -0.5 },
  body:       { fontFamily: 'Geist_400Regular' },
  bodyDim:    { fontFamily: 'Geist_400Regular',  color: '#8a93a3' },
  mono:       { fontFamily: 'GeistMono_400Regular' },
  monoBright: { fontFamily: 'GeistMono_500Medium' },
  eyebrow:    {
    fontFamily:     'GeistMono_500Medium',
    fontSize:       9,
    letterSpacing:  2.88,
    textTransform:  'uppercase' as const,
    color:          '#8a93a3',
  },
} as const;

export const RADIUS = {
  pill:     9999,
  card:     24,
  hairline: 1,
  disc:     9999,
} as const;

export const SPACE = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  32,
  xxxl: 48,
} as const;

/** Animation durations in milliseconds */
export const DUR = {
  fast:  200,
  base:  380,
  view:  480,
  morph: 700,
} as const;

/** Cubic-bezier for expo-style ease-out — matches CSS cubic-bezier(.22,1,.36,1) */
export const EASE_OUT_EXPO = {
  curve: [0.22, 1, 0.36, 1] as const,
} as const;
