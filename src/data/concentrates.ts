/**
 * Cannabis concentrates in active 2025-2026 rotation.
 *
 * Source: docs/perfect_dab/concentrates.json
 *
 * `surface_temp_range_f` and `surface_temp_optimal_f` are INTERIOR SURFACE
 * temperatures (Terpometer-equivalent contact probe truth — NOT IR readings).
 * Both are nullable for items that should not be dabbed (`blocked` set).
 *
 * Discriminated union on `category`. The `dabbable` helper resolves to true
 * only when an optimal surface temp exists and the entry is not `blocked`.
 */

export type ConcentrateCategory =
  | 'solventless'
  | 'hydrocarbon';

export type TerpeneProfile = 'none' | 'low' | 'med' | 'high';

interface ConcentrateBase {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly surface_temp_range_f: readonly [number, number] | null;
  readonly surface_temp_optimal_f: number | null;
  readonly terpene_profile: TerpeneProfile;
  readonly good_for_cold_start: boolean;
  readonly blocked?: string;
  readonly warning?: string;
  readonly notes: readonly string[];
  readonly confidence: string;
  readonly tags: readonly string[];
}

export interface SolventlessConcentrate extends ConcentrateBase {
  readonly category: 'solventless';
}

export interface HydrocarbonConcentrate extends ConcentrateBase {
  readonly category: 'hydrocarbon';
}

export type Concentrate =
  | SolventlessConcentrate
  | HydrocarbonConcentrate;

export type ConcentrateId = Concentrate['id'];

export const CONCENTRATES: readonly Concentrate[] = [
  {
    id: 'live-rosin',
    name: 'Live Rosin',
    category: 'solventless',
    description: 'Fresh-frozen pressed solventless. Glossy amber, sappy.',
    surface_temp_range_f: [445, 520],
    surface_temp_optimal_f: 480,
    terpene_profile: 'high',
    good_for_cold_start: true,
    notes: [
      'Cold start GOLD STANDARD',
      '710 Labs anchor: 400-450°F surface',
      'Above 520°F = generic dab taste',
    ],
    confidence: 'BRAND+COMMUNITY',
    tags: ['SOLVENTLESS', 'COLD_START'],
  },
  {
    id: 'cold-cure',
    name: 'Cold Cure Rosin',
    category: 'solventless',
    description: 'Live rosin nucleated to creamy badder. Most popular 2026 rosin format.',
    surface_temp_range_f: [375, 510],
    surface_temp_optimal_f: 460,
    terpene_profile: 'high',
    good_for_cold_start: true,
    notes: [
      'Cold start STRONGLY recommended',
      'Mood/Puffco anchor: 375-450°F surface',
      'Pushing past 500°F defeats the cure',
    ],
    confidence: 'BRAND+MFR',
    tags: ['SOLVENTLESS', 'COLD_START', '2026_DOMINANT'],
  },
  {
    id: 'fresh-press',
    name: 'Fresh Press Rosin',
    category: 'solventless',
    description: 'Un-cured rosin. Most volatile-rich, terps not yet homogenized.',
    surface_temp_range_f: [440, 510],
    surface_temp_optimal_f: 470,
    terpene_profile: 'high',
    good_for_cold_start: true,
    notes: ['Cold start strongly recommended', 'Gentle ramp protects pinene + ocimene'],
    confidence: 'BRAND+COMMUNITY',
    tags: ['SOLVENTLESS', 'COLD_START'],
  },
  {
    id: 'rosin-jam',
    name: 'Rosin Jam',
    category: 'solventless',
    description: 'THCa diamonds in terpene-rich rosin sauce. Heterogeneous.',
    surface_temp_range_f: [490, 545],
    surface_temp_optimal_f: 510,
    terpene_profile: 'high',
    good_for_cold_start: true,
    notes: [
      'Slurper preferred — separates phases dynamically',
      'Crystals need >=480°F to melt cleanly',
    ],
    confidence: 'COMMUNITY+BRAND',
    tags: ['SOLVENTLESS', 'BLEND'],
  },
  {
    id: 'rosin-badder',
    name: 'Rosin Badder',
    category: 'solventless',
    description: 'Whipped/agitated rosin. Hashwriter avg 520°F Terpometer interior.',
    surface_temp_range_f: [480, 540],
    surface_temp_optimal_f: 510,
    terpene_profile: 'high',
    good_for_cold_start: false,
    notes: ['Cold start optional'],
    confidence: 'COMMUNITY',
    tags: ['SOLVENTLESS'],
  },
  {
    id: 'hot-cure',
    name: 'Hot Cure Rosin',
    category: 'solventless',
    description: 'Whipped/cured at 90-225°F. Profile shifts to heavier sesquiterpenes.',
    surface_temp_range_f: [480, 545],
    surface_temp_optimal_f: 510,
    terpene_profile: 'med',
    good_for_cold_start: false,
    notes: ['Cold start optional', 'Caryophyllene dominant — needs more heat than fresh'],
    confidence: 'BRAND+COMMUNITY',
    tags: ['SOLVENTLESS'],
  },
  {
    id: 'high-melt-rosin',
    name: 'High-Melt / Nug-Run Hash Rosin',
    category: 'solventless',
    description: 'Premium hash rosin from highest-grade nugs. Connoisseur tier 2025-26.',
    surface_temp_range_f: [445, 510],
    surface_temp_optimal_f: 475,
    terpene_profile: 'high',
    good_for_cold_start: true,
    notes: ['Treat like live rosin', "710 Labs Tier 3, Papa's Select top tier"],
    confidence: 'BRAND',
    tags: ['SOLVENTLESS', 'PREMIUM'],
  },
  {
    id: 'live-resin',
    name: 'Live Resin',
    category: 'hydrocarbon',
    description:
      'Fresh-frozen hydrocarbon BHO. ~34% of concentrate sales. Yellow-amber sauce/wax.',
    surface_temp_range_f: [480, 545],
    surface_temp_optimal_f: 510,
    terpene_profile: 'high',
    good_for_cold_start: false,
    notes: [
      'Cold start optional',
      'Stay <=545°F surface to preserve linalool + humulene',
      'Most popular hydrocarbon format',
    ],
    confidence: 'MFR+BRAND+COMMUNITY',
    tags: ['HYDROCARBON', 'POPULAR'],
  },
  {
    id: 'cured-resin',
    name: 'Cured Resin',
    category: 'hydrocarbon',
    description:
      'BHO from cured flower. General-purpose hydrocarbon. Lost most volatile monoterps.',
    surface_temp_range_f: [520, 580],
    surface_temp_optimal_f: 545,
    terpene_profile: 'low',
    good_for_cold_start: false,
    notes: ['Cold start NOT typical', 'Sesquiterpene-heavy — takes more heat'],
    confidence: 'BRAND+COMMUNITY',
    tags: ['HYDROCARBON'],
  },
  {
    id: 'shatter',
    name: 'Shatter',
    category: 'hydrocarbon',
    description: 'Glassy BHO. Once dominant, now legacy/budget tier.',
    surface_temp_range_f: [510, 580],
    surface_temp_optimal_f: 545,
    terpene_profile: 'low',
    good_for_cold_start: false,
    notes: ['Cold start NOT typical', 'Most volatile terps already lost in process'],
    confidence: 'COMMUNITY',
    tags: ['HYDROCARBON', 'LEGACY'],
  },
  {
    id: 'wax-budder',
    name: 'Wax / Budder / Badder',
    category: 'hydrocarbon',
    description: 'Whipped BHO. Stable mid-tier across menus.',
    surface_temp_range_f: [480, 540],
    surface_temp_optimal_f: 510,
    terpene_profile: 'med',
    good_for_cold_start: false,
    notes: ['Cold start optional/popular'],
    confidence: 'COMMUNITY',
    tags: ['HYDROCARBON'],
  },
  {
    id: 'crumble',
    name: 'Crumble / Honeycomb',
    category: 'hydrocarbon',
    description: 'Dry powdery BHO. Lower moisture vaporizes easily.',
    surface_temp_range_f: [480, 550],
    surface_temp_optimal_f: 510,
    terpene_profile: 'med',
    good_for_cold_start: false,
    notes: ['Pearls essential to distribute', 'Cold start useful'],
    confidence: 'COMMUNITY',
    tags: ['HYDROCARBON'],
  },
  {
    id: 'sugar',
    name: 'Sugar Wax',
    category: 'hydrocarbon',
    description: 'Small THCa crystals in terpene matrix. Sugar/sauce texture.',
    surface_temp_range_f: [480, 545],
    surface_temp_optimal_f: 510,
    terpene_profile: 'high',
    good_for_cold_start: true,
    notes: ['Cold start LOVED for this texture'],
    confidence: 'COMMUNITY',
    tags: ['HYDROCARBON', 'COLD_START'],
  },
  {
    id: 'sauce-htfse',
    name: 'Sauce',
    category: 'hydrocarbon',
    description:
      'High-terpene full-spectrum extract. ~50% terpenes — viscous syrup with diamonds.',
    surface_temp_range_f: [500, 580],
    surface_temp_optimal_f: 530,
    terpene_profile: 'high',
    good_for_cold_start: true,
    notes: ['Cold start recommended for HTFSE', 'Slurper geometry designed for this'],
    confidence: 'BRAND+COMMUNITY',
    tags: ['HYDROCARBON', 'COLD_START'],
  },
  {
    id: 'thca-diamonds',
    name: 'THCa Diamonds (alone)',
    category: 'hydrocarbon',
    description: 'Discrete crystalline gemstones, 95-99% THCa, near-zero terpenes.',
    surface_temp_range_f: [500, 600],
    surface_temp_optimal_f: 545,
    terpene_profile: 'none',
    good_for_cold_start: false,
    notes: [
      'Pearls essential',
      'Cold start useful',
      'Source-conflict: Mood (e-rig) vs Hemper (IR-bottom) — sensor-driven',
    ],
    confidence: 'MFR+BRAND',
    tags: ['HYDROCARBON', 'PURE'],
  },
  {
    id: 'diamonds-sauce',
    name: 'Diamonds & Sauce',
    category: 'hydrocarbon',
    description: 'Combined product — crystals in terpene-rich sauce.',
    surface_temp_range_f: [510, 570],
    surface_temp_optimal_f: 530,
    terpene_profile: 'high',
    good_for_cold_start: true,
    notes: ['Slurper preferred', 'Cold start: sauce volatilizes first, then crystals'],
    confidence: 'MFR+BRAND',
    tags: ['HYDROCARBON', 'COLD_START', 'BLEND'],
  },
  {
    id: 'crystalline',
    name: 'THCa Crystalline / Isolate',
    category: 'hydrocarbon',
    description: 'Pure powder, >99% THCa. Zero terpenes — no flavor to preserve.',
    surface_temp_range_f: [525, 600],
    surface_temp_optimal_f: 560,
    terpene_profile: 'none',
    good_for_cold_start: false,
    notes: [
      'Use sticky binder (live resin) for cold start',
      'Just needs full vaporization of THC',
    ],
    confidence: 'COMMUNITY',
    tags: ['HYDROCARBON', 'PURE', 'NICHE'],
  },
  {
    id: 'liquid-diamonds',
    name: 'Liquid Diamonds (cart format)',
    category: 'hydrocarbon',
    description:
      'Live resin + THCa diamonds. Dominant high-potency cart category 2024-26.',
    surface_temp_range_f: [500, 570],
    surface_temp_optimal_f: 530,
    terpene_profile: 'high',
    good_for_cold_start: false,
    notes: [
      'Mostly vaped not dabbed — flag distinction',
      'If dabbing jar form: treat like diamonds & sauce',
    ],
    confidence: 'BRAND',
    tags: ['HYDROCARBON', 'TRENDING'],
  },

] as const;

/**
 * `true` when the concentrate has an optimal surface temp and is not blocked.
 */
export function isDabbable(concentrate: Concentrate): boolean {
  return concentrate.surface_temp_optimal_f != null && concentrate.blocked == null;
}

export function findConcentrate(id: string): Concentrate | undefined {
  return CONCENTRATES.find((c) => c.id === id);
}
