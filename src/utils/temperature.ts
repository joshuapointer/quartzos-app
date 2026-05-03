export const fToC = (f: number): number => Math.round((f - 32) * 5 / 9);
export const cToF = (c: number): number => Math.round(c * 9 / 5 + 32);
export const formatTemp = (f: number, useCelsius: boolean): string =>
  useCelsius ? `${fToC(f)}°C` : `${f}°F`;

/**
 * Clamp a (dab, dunk) alarm pair to enforce protocol bounds and the
 * cross-field constraint that dunk must sit at least 10°F below dab.
 *
 * Bounds: 100 ≤ dab ≤ 900, 100 ≤ dunk ≤ dab - 10.
 *
 * Used by `useSettingsStore.setSettings` so any path through the store
 * lands a valid pair, and by `BleManager.writeSettings` as
 * defense-in-depth before the encoded frame leaves the app.
 */
export function validateAlarms(
  dab: number,
  dunk: number,
): { dab: number; dunk: number } {
  const clampedDab = Math.min(900, Math.max(100, Math.round(dab)));
  const dunkUpper = clampedDab - 10;
  // Floor for dunk is 100; if dab is at the protocol minimum (100) the
  // upper bound becomes 90, and we must allow dunk to drop below the
  // 100 floor to stay below dab. We pin dunk at dunkUpper in that case.
  const clampedDunk = Math.min(dunkUpper, Math.max(100, Math.round(dunk)));
  // If dab is so low that the 100 floor fights the cross-field rule,
  // honor the cross-field rule (dab - 10) over the floor.
  const finalDunk = clampedDunk > dunkUpper ? dunkUpper : clampedDunk;
  return { dab: clampedDab, dunk: finalDunk };
}
