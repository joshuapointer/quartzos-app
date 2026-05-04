/**
 * dabwith.me — squishy pastel design tokens
 *
 * Source of truth: dabwithme-flow.html (the canonical prototype).
 * Every CSS oklch() value from the prototype is converted to its sRGB hex
 * approximation here so React Native can consume it. The original oklch
 * literal is preserved in a comment for future Skia migration.
 *
 * The palette has FOUR roles:
 *   1. paper — bg + surface + border (lilac-cream, never pure white)
 *   2. ink   — fg + muted (warm-grey)
 *   3. peach — accent + accent-deep (the ONE loud color, used at most twice/screen)
 *   4. mood  — mint / lilac / butter / warm (carry phase tints, never compete with peach)
 */

export const palette = {
  // paper
  bg:        '#FBF1F4', /* oklch(0.97 0.025 320) */
  surface:   '#FCF8FB', /* oklch(0.99 0.012 320) */
  border:    '#E7D5DF', /* oklch(0.90 0.04 320) */

  // ink
  fg:        '#3F3548', /* oklch(0.30 0.04 300) */
  muted:     '#867694', /* oklch(0.55 0.04 300) */

  // peach (the ONE accent)
  accent:     '#F29981', /* oklch(0.75 0.18 30) */
  accentDeep: '#D97A5D', /* oklch(0.65 0.20 28) */
  accentInk:  '#5C2A1B', /* press-text shadow color */

  // mood tints
  mint:   '#A3E2C4', /* oklch(0.85 0.10 165) */
  lilac:  '#CDB4E0', /* oklch(0.82 0.10 305) */
  butter: '#EFD986', /* oklch(0.90 0.12 95)  */
  warm:   '#F0B87C', /* oklch(0.78 0.16 50)  */

  // utility
  white:  '#FFFFFF',
  black:  '#1C1226',
  shadow: 'rgba(82, 51, 95, 0.18)',  // soft-purple cast
  shadowDeep: 'rgba(217, 122, 93, 0.30)',
} as const;

/**
 * Bub's mood maps to a body-gradient PAIR (core, edge) and a halo tint.
 * Set these via the `mood` prop on <Bub>; the temperature-driven cool phase
 * overrides them with an interpolated value at runtime.
 */
export const moodPalette = {
  idle:        { core: '#F3C4A8', edge: '#EDE1EB', halo: 'rgba(243, 196, 168, 0.35)' },
  curious:     { core: '#F5B291', edge: '#EADDEC', halo: 'rgba(245, 178, 145, 0.40)' },
  eager:       { core: '#F4A785', edge: '#E9DDE9', halo: 'rgba(244, 167, 133, 0.50)' },
  heat:        { core: '#EBB37A', edge: '#F0B39B', halo: 'rgba(235, 179, 122, 0.65)' },
  cool:        { core: '#A3E2C4', edge: '#D9EAE6', halo: 'rgba(163, 226, 196, 0.50)' },
  dab:         { core: '#F29981', edge: '#E9C8E2', halo: 'rgba(242, 153, 129, 0.60)' },
  dunk:        { core: '#9BCFDC', edge: '#CFD8E3', halo: 'rgba(155, 207, 220, 0.45)' },
  clean:       { core: '#BEE5B1', edge: '#DEEADB', halo: 'rgba(190, 229, 177, 0.40)' },
  done:        { core: '#CDB4E0', edge: '#E8DEE5', halo: 'rgba(205, 180, 224, 0.55)' },
} as const;

export type MoodKey = keyof typeof moodPalette;

/**
 * Spring presets — every motion in dabwith.me is springy. The cubic-bezier
 * (.34, 1.56, .64, 1) used in the CSS prototype maps to these damped/stiff
 * Reanimated springs in RN (chosen empirically to match the visual cadence).
 */
export const springs = {
  squish:  { damping: 10, stiffness: 220, mass: 0.6 },  // tap squish
  pop:     { damping: 14, stiffness: 200, mass: 0.7 },  // peek-in entrance
  gentle:  { damping: 18, stiffness: 140, mass: 1.0 },  // size / position
  ease:    { damping: 22, stiffness: 180, mass: 1.0 },  // smooth resize
} as const;

export const radii = {
  sm:    8,
  md:   16,
  lg:   22,
  xl:   28,
  pill: 999,
} as const;

export const fontStack = {
  // We keep using the Geist family the app already loads; dabwith.me's
  // "rounded" feel comes from font weight + tight letter-spacing, not a new
  // typeface (no font swap = no extra TTF download, no FOUT on cold launch).
  display: 'Geist_700Bold',
  displayHeavy: 'Geist_800ExtraBold',
  body: 'Geist_400Regular',
  bodyMedium: 'Geist_500Medium',
  mono: 'GeistMono_500Medium',
} as const;

/**
 * The wordmark renders the .me suffix in peach. These are the precise sizes
 * used across Bub's journey — header, complete-screen hero, etc.
 */
export const wordmark = {
  header:  { size: 21, dotKern: 0.5, letterSpacing: -0.035 * 21 },
  display: { size: 38, dotKern: 0.5, letterSpacing: -0.04 * 38 },
} as const;

export const layout = {
  phoneRefHeight: 844,
  phoneRefWidth:  390,
  screenPaddingX: 22,
} as const;
