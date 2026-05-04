/**
 * Banger wall thickness modifier. Thinner walls heat and cool faster, thicker
 * walls retain more heat and increase Fourier conduction lag.
 *
 * Source: docs/perfect_dab/wall_thicknesses.json (v2.0.0).
 *
 * v2 fields:
 *   - `gradient_multiplier` — scales `banger.gradient_lag_f` (Fourier τ = L²/α).
 *
 * Legacy v1 field preserved as soft override:
 *   - `modifier_f` — additive °F nudge on top of the multiplicative model.
 */

export type WallThicknessId = 'thin' | 'standard' | 'thick' | 'unknown';

export interface WallThickness {
  readonly id: WallThicknessId;
  readonly name: string;
  readonly thickness_mm_range: string | null;
  readonly modifier_f: number;
  readonly gradient_multiplier: number;
  readonly description: string;
}

export const WALL_THICKNESSES: readonly WallThickness[] = [
  {
    id: 'thin',
    name: 'Thin (2 mm)',
    thickness_mm_range: '1.5-2.5',
    modifier_f: -8,
    gradient_multiplier: 0.5,
    description: 'Light flat tops. Faster heat, faster cool. Smaller interior↔exterior gradient.',
  },
  {
    id: 'standard',
    name: 'Standard (3-4 mm)',
    thickness_mm_range: '3-4',
    modifier_f: 0,
    gradient_multiplier: 1.0,
    description: 'Typical premium banger. Default. Banger gradient_lag_f values are anchored here.',
  },
  {
    id: 'thick',
    name: 'Thick (5-6 mm)',
    thickness_mm_range: '5-6',
    modifier_f: 12,
    gradient_multiplier: 1.6,
    description: 'Heavy reactor / opaque floor. More retention, larger gradient — Fourier τ scales as L².',
  },
  {
    id: 'unknown',
    name: "Don't Know",
    thickness_mm_range: null,
    modifier_f: 0,
    gradient_multiplier: 1.0,
    description: 'Defaults to standard.',
  },
] as const;

export function findWallThickness(id: string): WallThickness | undefined {
  return WALL_THICKNESSES.find((w) => w.id === id);
}
