/**
 * Shatterbox — amber-glass / underground design tokens
 *
 * Source of truth: shatterbox/brand-spec.md (amber-on-ink, single-accent budget,
 * engraved geometry, no glassmorphism, no pills, no italic).
 *
 * Original oklch() values from the spec are preserved in /* oklch(...) *\/
 * comments alongside their sRGB hex approximations for RN consumption.
 *
 * Palette roles:
 *   1. ink    — bg / surface / border (basement floor → engraved gold hairline)
 *   2. bone   — fg / muted (cool warm-white primary text + dim gold secondary)
 *   3. amber  — accent / accentDeep (the ONE neon, used at most twice/screen)
 *   4. shards — referenced only by the broken-glass background plate
 */

export const palette = {
  // ink
  bg:        '#1a1410', /* oklch(0.15 0.014 60) — basement floor */
  surface:   '#241c15', /* oklch(0.20 0.022 62) — slightly lifted card */
  border:    '#4a3826', /* oklch(0.34 0.05  62) — engraved gold hairline */

  // bone (typography on dark surfaces)
  fg:        '#f5edd9', /* oklch(0.96 0.024 78) — primary text */
  muted:     '#b8a685', /* oklch(0.70 0.05  70) — secondary text */

  // amber (the ONE accent — single neon)
  accent:     '#f5a44a', /* oklch(0.75 0.18 68) — amber-glass */
  accentDeep: '#b06832', /* oklch(0.54 0.14 55) — pressed/glow base */
  accentInk:  '#1a1410', /* press-text on amber surface */

  // mood tints — collapsed to amber-glass register. The orb is the warm
  // thing inside the cold room; its colour does not modulate per phase
  // in this brand direction. Tokens kept for back-compat with consumers.
  mint:   '#f5a44a',
  lilac:  '#f5a44a',
  butter: '#f5a44a',
  warm:   '#f5a44a',

  // utility
  white:  '#FFFFFF',
  black:  '#0c0a08',
  shadow:     'rgba(0, 0, 0, 0.5)',          // neutral cast (spec)
  shadowDeep: 'rgba(245, 164, 74, 0.45)',    // amber glow — active button only
} as const;

/**
 * The orb renders in a single amber-glass register. Mood props remain on
 * the API for back-compat, but every key resolves to the same gradient pair
 * + halo so the visual identity is unified.
 */
const AMBER_GLASS = {
  core: '#f5a44a',
  edge: '#3a261a',
  halo: 'rgba(245, 164, 74, 0.55)',
} as const;

export const moodPalette = {
  idle:    AMBER_GLASS,
  curious: AMBER_GLASS,
  eager:   AMBER_GLASS,
  heat:    AMBER_GLASS,
  cool:    AMBER_GLASS,
  dab:     AMBER_GLASS,
  dunk:    AMBER_GLASS,
  clean:   AMBER_GLASS,
  done:    AMBER_GLASS,
} as const;

export type MoodKey = keyof typeof moodPalette;

/**
 * Spring presets — the orb's 2° wobble + button 1px translate live here.
 * Springs preserved so motion physics don't regress; consumer components
 * choose tighter timings independently.
 */
export const springs = {
  squish:  { damping: 10, stiffness: 220, mass: 0.6 },
  pop:     { damping: 14, stiffness: 200, mass: 0.7 },
  gentle:  { damping: 18, stiffness: 140, mass: 1.0 },
  ease:    { damping: 22, stiffness: 180, mass: 1.0 },
} as const;

/**
 * Engraved geometry — cards 4px, buttons/chips 2px, hairlines 0px.
 * No 999px pills. `pill` alias collapses to a 2px engraved chip so any
 * legacy consumer renders correctly without an explicit edit.
 */
export const radii = {
  sm:    2,
  md:    4,
  lg:    4,
  xl:    4,
  pill:  2, // back-compat alias — engraved chip, not a pill
  chip:  2,
} as const;

export const fontStack = {
  display:      'BebasNeue_400Regular',
  displayHeavy: 'BebasNeue_400Regular',
  body:         'JetBrainsMono_400Regular',
  bodyMedium:   'JetBrainsMono_500Medium',
  mono:         'JetBrainsMono_500Medium',
} as const;

/**
 * Wordmark renders DABWITH.ME in condensed-black UPPERCASE. Tracking is
 * positive (+0.6%) per spec. The .ME suffix is amber; the rest is bone.
 */
export const wordmark = {
  header:  { size: 21, dotKern: 0.5, letterSpacing: 0.006 * 21 },
  display: { size: 38, dotKern: 0.5, letterSpacing: 0.006 * 38 },
} as const;

export const layout = {
  phoneRefHeight: 844,
  phoneRefWidth:  390,
  screenPaddingX: 22,
} as const;
