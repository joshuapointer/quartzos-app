/**
 * Backwards-compat shim for the legacy `Extract` type.
 *
 * Pre-perfect-dab code (the v1 NewPresetWizard, home screen, history sheet)
 * used a 13-entry array of `{ id, name, type, baseTemp, color1, color2 }`
 * keyed by short legacy ids like `fullMelt`, `rosin`, `liveRosin`, etc.
 *
 * This module re-derives that same shape from the new `CONCENTRATES` catalog
 * so unmigrated callers keep compiling and finding their concentrate by id.
 *
 * - Legacy ids resolve via `LEGACY_TO_NEW_ID` to the closest new concentrate.
 * - Type mapping: solventless→Solventless, hydrocarbon→Hydrocarbon,
 *   distillate/novel→Isolate (legacy bucket), hash→Solventless.
 * - Each legacy id keeps its original color pair (preserved color palette
 *   from the v1 wizard); blocked / non-dabbable concentrates are filtered out.
 *
 * New code should import from `./dabReference` directly.
 */

import { CONCENTRATES, isDabbable, type Concentrate } from './concentrates';

export type ExtractType = 'Solventless' | 'Hydrocarbon' | 'Isolate';

export interface Extract {
  id: string;
  name: string;
  type: ExtractType;
  baseTemp: number;
  color1: string;
  color2: string;
}

/**
 * Map legacy wizard ids → new perfect-dab concentrate ids.
 *
 * Legacy ids derived from `src/design/components/NewPresetWizard.tsx` v1.
 * Each one points at the closest semantic match in `CONCENTRATES`.
 */
export const LEGACY_TO_NEW_ID: Readonly<Record<string, string>> = {
  // Solventless
  fullMelt: 'bubble-6star',
  rosin: 'fresh-press',
  liveRosin: 'live-rosin',
  hashRosin: 'hash-rosin-coin',
  freshPress: 'fresh-press',
  coldCure: 'cold-cure',
  // Hydrocarbon
  liveResin: 'live-resin',
  badder: 'wax-budder',
  terpSauce: 'sauce-htfse',
  shatter: 'shatter',
  crumble: 'crumble',
  // Isolate (legacy bucket — these are distillate/diamonds in the new model)
  diamonds: 'thca-diamonds',
  thca: 'crystalline',
  distillate: 'thc-distillate',
} as const;

/** Default color pair per legacy id, preserved from the v1 wizard palette. */
const LEGACY_COLORS: Readonly<Record<string, readonly [string, string]>> = {
  fullMelt: ['#E8DEC0', '#C0AC78'],
  rosin: ['#B8944C', '#7A5C28'],
  liveRosin: ['#C4A860', '#886030'],
  hashRosin: ['#C09050', '#7C5420'],
  freshPress: ['#D4C278', '#A58C50'],
  coldCure: ['#C4AC74', '#7D6840'],
  liveResin: ['#B8782C', '#704820'],
  badder: ['#CC9038', '#885820'],
  terpSauce: ['#A86C24', '#5C3810'],
  shatter: ['#A06830', '#604030'],
  crumble: ['#946040', '#583828'],
  diamonds: ['#D8E4EC', '#A8C0D4'],
  thca: ['#F0ECD8', '#C8C0A8'],
  distillate: ['#C8D8E8', '#8898A8'],
};

/** Display names preserved from v1 wizard so the legacy UI copy is unchanged. */
const LEGACY_NAMES: Readonly<Record<string, string>> = {
  fullMelt: '6-Star Melt',
  rosin: 'Rosin',
  liveRosin: 'Live Rosin',
  hashRosin: 'Hash Rosin',
  freshPress: 'Fresh Press',
  coldCure: 'Cold Cure',
  liveResin: 'Live Resin',
  badder: 'Badder',
  terpSauce: 'Terp Sauce',
  shatter: 'Shatter',
  crumble: 'Crumble',
  diamonds: 'Diamonds',
  thca: 'THCa Powder',
  distillate: 'Distillate',
};

const CATEGORY_DEFAULT_COLORS: Readonly<Record<Concentrate['category'], readonly [string, string]>> = {
  solventless: ['#C4A860', '#886030'],
  hash: ['#A58860', '#6E5530'],
  hydrocarbon: ['#B8782C', '#704820'],
  distillate: ['#C8D8E8', '#8898A8'],
  novel: ['#D8E4EC', '#A8C0D4'],
};

function legacyTypeForCategory(category: Concentrate['category']): ExtractType {
  switch (category) {
    case 'solventless':
    case 'hash':
      return 'Solventless';
    case 'hydrocarbon':
      return 'Hydrocarbon';
    case 'distillate':
    case 'novel':
      return 'Isolate';
  }
}

function buildLegacyExtract(legacyId: string, newId: string): Extract | null {
  const c = CONCENTRATES.find((x) => x.id === newId);
  if (!c || !isDabbable(c) || c.surface_temp_optimal_f == null) return null;
  const [color1, color2] = LEGACY_COLORS[legacyId] ?? CATEGORY_DEFAULT_COLORS[c.category];
  return {
    id: legacyId,
    name: LEGACY_NAMES[legacyId] ?? c.name,
    type: legacyTypeForCategory(c.category),
    baseTemp: c.surface_temp_optimal_f,
    color1,
    color2,
  };
}

/**
 * Legacy `EXTRACTS` array. Order preserved from v1 (Solventless first, then
 * Hydrocarbon, then Isolate) so any UI relying on positional defaults keeps
 * its pre-migration behavior.
 */
export const EXTRACTS: readonly Extract[] = (
  [
    'fullMelt',
    'rosin',
    'liveRosin',
    'hashRosin',
    'freshPress',
    'coldCure',
    'liveResin',
    'badder',
    'terpSauce',
    'shatter',
    'crumble',
    'diamonds',
    'thca',
    'distillate',
  ] as const
)
  .map((legacyId) => buildLegacyExtract(legacyId, LEGACY_TO_NEW_ID[legacyId]))
  .filter((e): e is Extract => e !== null);

export const EXTRACT_TYPES: readonly ExtractType[] = ['Solventless', 'Hydrocarbon', 'Isolate'];

export function findExtract(id: string): Extract | undefined {
  return EXTRACTS.find((e) => e.id === id);
}
