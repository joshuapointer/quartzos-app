import type { OrbState } from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function isHeat(s: OrbState): boolean {
  return s === 'heat' || s === 'heat-reheat';
}

export function isCool(s: OrbState): boolean {
  return (
    s === 'cool' ||
    s === 'cool-fast-drop' ||
    s === 'cool-in-window' ||
    s === 'dab' ||
    s === 'dunk' ||
    s === 'clean'
  );
}
