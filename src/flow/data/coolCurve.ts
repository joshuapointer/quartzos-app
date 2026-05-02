/**
 * Exponential decay model for the post-torch cool-down in timed mode.
 * T(t) = ambient + (peak - ambient) * exp(-k * t)
 * k is tuned so that T(COOL_TOTAL_MS) ≈ target - 5°F.
 * Drop rate = (peak - ambient) * k * exp(-k * t) * 1000  [°F/sec, positive]
 */

export const COOL_TOTAL_MS = 25000;

const DEFAULT_AMBIENT = 150;

function decayK(peak: number, target: number, ambient: number): number {
  return -Math.log((target - 5 - ambient) / (peak - ambient)) / COOL_TOTAL_MS;
}

function isDegenerate(peak: number, target: number, ambient: number): boolean {
  return peak <= ambient || target - 5 <= ambient;
}

export function predictCoolTemp(
  elapsedMs: number,
  peak: number,
  target: number,
  ambient: number = DEFAULT_AMBIENT,
): number {
  if (isDegenerate(peak, target, ambient)) return target;
  const t = Math.max(0, elapsedMs);
  const k = decayK(peak, target, ambient);
  return ambient + (peak - ambient) * Math.exp(-k * t);
}

export function predictCoolDropRate(
  elapsedMs: number,
  peak: number,
  target: number,
  ambient: number = DEFAULT_AMBIENT,
): number {
  if (isDegenerate(peak, target, ambient)) return 0;
  const t = Math.max(0, elapsedMs);
  const k = decayK(peak, target, ambient);
  return (peak - ambient) * k * Math.exp(-k * t) * 1000;
}

/**
 * Inverse of predictCoolTemp: returns the elapsed ms at which T(t) crosses
 * `desiredTemp`, using the same k tuned for the dab target. Used by timed
 * mode to drive an accurate countdown to the recommended dab temperature.
 *
 * Returns 0 if `desiredTemp` is at or above peak (already past). Returns
 * COOL_TOTAL_MS as a graceful fallback for degenerate inputs.
 */
export function predictTimeToTemp(
  desiredTemp: number,
  peak: number,
  target: number,
  ambient: number = DEFAULT_AMBIENT,
): number {
  if (isDegenerate(peak, target, ambient)) return COOL_TOTAL_MS;
  if (desiredTemp >= peak) return 0;
  if (desiredTemp <= ambient) return COOL_TOTAL_MS;
  const k = decayK(peak, target, ambient);
  return -Math.log((desiredTemp - ambient) / (peak - ambient)) / k;
}
