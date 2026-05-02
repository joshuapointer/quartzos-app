/**
 * Exponential decay model for the post-torch cool-down in timed mode.
 * T(t) = ambient + (peak - ambient) * exp(-k * t)
 * k is tuned so that T(totalMs) ≈ target - 5°F. `totalMs` defaults to the
 * legacy COOL_TOTAL_MS but is overridable so the curve can match the
 * banger's real cool_seconds profile (timed mode passes that through).
 * Drop rate = (peak - ambient) * k * exp(-k * t) * 1000  [°F/sec, positive]
 */

export const COOL_TOTAL_MS = 25000;

const DEFAULT_AMBIENT = 150;

function decayK(peak: number, target: number, ambient: number, totalMs: number): number {
  return -Math.log((target - 5 - ambient) / (peak - ambient)) / totalMs;
}

function isDegenerate(peak: number, target: number, ambient: number): boolean {
  return peak <= ambient || target - 5 <= ambient;
}

export function predictCoolTemp(
  elapsedMs: number,
  peak: number,
  target: number,
  ambient: number = DEFAULT_AMBIENT,
  totalMs: number = COOL_TOTAL_MS,
): number {
  if (isDegenerate(peak, target, ambient)) return target;
  const t = Math.max(0, elapsedMs);
  const k = decayK(peak, target, ambient, totalMs);
  return ambient + (peak - ambient) * Math.exp(-k * t);
}

export function predictCoolDropRate(
  elapsedMs: number,
  peak: number,
  target: number,
  ambient: number = DEFAULT_AMBIENT,
  totalMs: number = COOL_TOTAL_MS,
): number {
  if (isDegenerate(peak, target, ambient)) return 0;
  const t = Math.max(0, elapsedMs);
  const k = decayK(peak, target, ambient, totalMs);
  return (peak - ambient) * k * Math.exp(-k * t) * 1000;
}
