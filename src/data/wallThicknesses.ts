/**
 * Banger wall thickness modifier. Thinner walls heat and cool faster, thicker
 * walls retain more heat and need a slightly higher displayed target.
 *
 * Source: docs/ref/perfect_dab/wall_thicknesses.json
 */

export type WallThicknessId = 'thin' | 'standard' | 'thick' | 'unknown';

export interface WallThickness {
  readonly id: WallThicknessId;
  readonly name: string;
  readonly thickness_mm_range: string | null;
  readonly modifier_f: number;
  readonly description: string;
}

export const WALL_THICKNESSES: readonly WallThickness[] = [
  {
    id: 'thin',
    name: 'Thin (2 mm)',
    thickness_mm_range: '1.5-2.5',
    modifier_f: -8,
    description: 'Light flat tops. Faster heat, faster cool.',
  },
  {
    id: 'standard',
    name: 'Standard (3-4 mm)',
    thickness_mm_range: '3-4',
    modifier_f: 0,
    description: 'Typical premium banger. Default.',
  },
  {
    id: 'thick',
    name: 'Thick (5-6 mm)',
    thickness_mm_range: '5-6',
    modifier_f: 12,
    description: 'Heavy reactor / opaque. More retention.',
  },
  {
    id: 'unknown',
    name: "Don't Know",
    thickness_mm_range: null,
    modifier_f: 0,
    description: 'Defaults to standard.',
  },
] as const;

export function findWallThickness(id: string): WallThickness | undefined {
  return WALL_THICKNESSES.find((w) => w.id === id);
}
