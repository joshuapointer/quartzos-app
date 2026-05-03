import type { Banger, HeatTimeStage } from '../../../data/bangers';
import { ENAIL_DEFAULT_MIDPOINT_F } from '../../../utils/calibration';
import { DEFAULT_HEAT_FALLBACK_S } from './constants';

/**
 * Parse a "20-40" / "55-90" range string into the midpoint in seconds.
 * Handles "30" (single value), "20-40 host (or 10-25 cold-start)" (free text)
 * and bad data by falling back to `fallback`.
 */
export function parseRangeMidpoint(range: string, fallback: number): number {
  if (!range) return fallback;
  // Strip everything but the first <num>-<num> or <num> match.
  const match = range.match(/(\d+(?:\.\d+)?)\s*(?:[-–]\s*(\d+(?:\.\d+)?))?/);
  if (!match) return fallback;
  const lo = Number.parseFloat(match[1]);
  const hi = match[2] != null ? Number.parseFloat(match[2]) : lo;
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return fallback;
  return Math.round((lo + hi) / 2);
}

export function parseHeatSeconds(range: string): number {
  return parseRangeMidpoint(range, DEFAULT_HEAT_FALLBACK_S);
}

/**
 * Compute a PID setpoint for a given interior surface target. Uses the
 * banger's `pid_offset_midpoint_f` when present (e-bangers), otherwise the
 * +50°F community midpoint.
 */
export function pidSetpointFor(banger: Banger, interiorF: number): number {
  if (banger.geometry === 'enail') {
    return Math.round(interiorF + banger.pid_offset_midpoint_f);
  }
  return Math.round(interiorF + ENAIL_DEFAULT_MIDPOINT_F);
}

/**
 * For a slurper-class banger with a `heat_time_breakdown`, return a stable
 * sum of every stage's duration. Otherwise return the parsed midpoint.
 */
export function totalHeatSeconds(banger: Banger, wallMultiplier: number = 1.0): number {
  if (banger.heat_time_breakdown && banger.heat_time_breakdown.length > 0) {
    return banger.heat_time_breakdown.reduce(
      (acc: number, stage: HeatTimeStage) => acc + stage.duration_seconds,
      0,
    );
  }

  // Determine torch time dynamically from the banger's thermal mass.
  // The time constant tau (1/k) represents the mass's heat retention curve.
  // We apply a fraction (0.45) that aligns standard geometries with ~90-100s.
  // The wall multiplier correctly scales this value up for thicker quartz.
  if (banger.cooling && banger.cooling.k_per_second) {
    const tau = 1 / banger.cooling.k_per_second;
    return Math.round(tau * 0.45 * wallMultiplier);
  }

  return parseHeatSeconds(banger.heat_time_seconds);
}

/** Find the active stage index given cumulative elapsed seconds. */
export function activeStageFromElapsed(
  breakdown: readonly HeatTimeStage[],
  elapsed: number,
): number {
  let consumed = 0;
  for (let i = 0; i < breakdown.length; i += 1) {
    consumed += breakdown[i].duration_seconds;
    if (elapsed < consumed) return i;
  }
  return breakdown.length - 1;
}
