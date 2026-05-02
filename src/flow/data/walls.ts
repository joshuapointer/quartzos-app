import type { Wall } from './types';

export const WALLS: Wall[] = [
  {
    id: 'thin',
    name: 'Thin',
    thickness: '1.5–2.5 mm',
    mod: -8,
    gradient_multiplier: 0.5,
    description: 'Light flat tops. Faster heat, faster cool.',
  },
  {
    id: 'standard',
    name: 'Standard',
    thickness: '3–4 mm',
    mod: 0,
    gradient_multiplier: 1.0,
    description: 'Typical premium banger. Default.',
  },
  {
    id: 'thick',
    name: 'Thick',
    thickness: '5–6 mm',
    mod: 12,
    gradient_multiplier: 1.6,
    description: 'Heavy reactor / opaque. More retention.',
  },
  {
    id: 'unknown',
    name: "Don't know",
    thickness: '—',
    mod: 0,
    gradient_multiplier: 1.0,
    description: 'Defaults to standard.',
  },
];
