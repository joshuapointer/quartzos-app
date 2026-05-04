/**
 * Torch-time derivation engine.
 *
 * Parses `banger.heat_time_seconds` (e.g. "20-40", "55-90", "30") into a
 * numeric `{minS, maxS, midpointS}` triple. The midpoint is the canonical
 * UI value (the user's countdown timer). The full range powers UI affordances
 * like progress bars and "early/late" hints.
 *
 * Source: docs/perfect_dab/bangers.json — `heat_time_seconds` field.
 */

import type { Banger } from '../data/bangers';

export interface TorchDuration {
  readonly minS: number;
  readonly maxS: number;
  readonly midpointS: number;
}

const RANGE_RE = /(\d+)\s*[-–]\s*(\d+)/;
const SINGLE_RE = /(\d+)/;

/**
 * Parse a banger's `heat_time_seconds` string into numeric bounds.
 *
 * Accepts:
 *   - "20-40"          → { 20, 40, 30 }
 *   - "55-90"          → { 55, 90, 73 }
 *   - "30"             → { 30, 30, 30 }
 *   - "30 stabilize"   → { 30, 30, 30 } (single-number prefix)
 *   - "25-35 host"     → { 25, 35, 30 } (range prefix)
 *
 * Throws when neither pattern matches — every entry in the catalog is
 * required to produce a duration.
 */
export function parseTorchDuration(banger: Banger): TorchDuration {
  const raw = banger.heat_time_seconds;
  const range = raw.match(RANGE_RE);
  if (range) {
    const minS = Number(range[1]);
    const maxS = Number(range[2]);
    return { minS, maxS, midpointS: Math.round((minS + maxS) / 2) };
  }
  const single = raw.match(SINGLE_RE);
  if (single) {
    const s = Number(single[1]);
    return { minS: s, maxS: s, midpointS: s };
  }
  throw new Error(
    `[torchTimeEngine] Cannot parse heat_time_seconds "${raw}" for banger ${banger.id}`,
  );
}

/** Canonical torch-countdown duration (midpoint of catalog range). */
export function torchDurationS(banger: Banger): number {
  return parseTorchDuration(banger).midpointS;
}
