/**
 * Perfect-dab calibration engine.
 *
 * Converts an (concentrate, banger, sensor, wall) tuple into a *displayed*
 * dab target plus a recommended *dunk* alarm. Reproduces the canonical
 * formula from `docs/perfect_dab/schema.json`:
 *
 *     displayed = interior_surface_temp
 *               + wall.modifier_f
 *               + sensor_branch_offset
 *
 * Where `sensor_branch_offset` is:
 *   - contact (probe)  → 0  (reading IS the surface)
 *   - ir               → banger.ir_offset_sign * banger.ir_offset_f
 *   - enail (PID)      → banger.pid_offset_midpoint_f if e-banger,
 *                         else +50°F (community midpoint)
 *   - visual           → same as ir (best estimate)
 *
 * All five `schema.calibration.examples` round-trip through this engine.
 */

import type { Banger } from '../data/bangers';
import type { Concentrate } from '../data/concentrates';
import type { Sensor } from '../data/sensors';
import type { WallThickness } from '../data/wallThicknesses';

export const ENAIL_DEFAULT_MIDPOINT_F = 50;
const ENAIL_DUNK_F = 250;
const DUNK_DROP_F = 280;
const DUNK_MIN_F = 200;
const DUNK_MAX_F = 320;

export interface CalibrationInput {
  readonly concentrate: Concentrate;
  readonly banger: Banger;
  readonly sensor: Sensor;
  readonly wall: WallThickness;
  /** Optional ±°F nudge on top of the computed displayed target. */
  readonly tuneOffsetF?: number;
}

export interface CalibrationResult {
  /** Interior surface temp the dab actually contacts (concentrate optimum). */
  readonly interiorF: number;
  /** Wall modifier in °F. */
  readonly wallModF: number;
  /**
   * Sensor branch offset in °F. For IR / visual this is
   * `banger.ir_offset_sign * banger.ir_offset_f`. For e-nail it is the
   * banger's PID midpoint (or fallback +50). Probe (contact) is 0.
   */
  readonly irOffsetF: number;
  /** User-provided tune nudge applied last. */
  readonly tuneOffsetF: number;
  /** Final number the user sees on their device. */
  readonly displayedF: number;
  /** Recommended dunk-alarm temp. */
  readonly dunkF: number;
  /** Human-readable breakdown lines for UI. */
  readonly trace: readonly string[];
  /** Soft warnings (e.g., interior outside concentrate's surface_temp_range_f). */
  readonly warnings: readonly string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sensor-branch offset for an (sensor, banger) pair, ignoring wall modifier. */
function sensorBranchOffsetF(sensor: Sensor, banger: Banger): number {
  switch (sensor.method) {
    case 'contact':
      return 0;
    case 'ir':
    case 'visual':
      return banger.ir_offset_sign * banger.ir_offset_f;
    case 'enail':
      // E-bangers carry their own PID midpoint. For non-enail bangers (the
      // user explicitly picked the e-nail sensor anyway) fall back to the
      // community +50°F midpoint.
      return banger.geometry === 'enail'
        ? banger.pid_offset_midpoint_f
        : ENAIL_DEFAULT_MIDPOINT_F;
  }
}

function formatSign(n: number): string {
  if (n === 0) return '0';
  return n > 0 ? `+${n}` : String(n);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute a displayed dab target + a recommended dunk alarm for a given
 * (concentrate, banger, sensor, wall) tuple.
 *
 * Throws a friendly error when the concentrate has no `surface_temp_optimal_f`
 * (i.e., it's flagged `blocked` and shouldn't be dabbed).
 */
export function computeDisplayedTarget(input: CalibrationInput): CalibrationResult {
  const { concentrate, banger, sensor, wall } = input;
  const tuneOffsetF = input.tuneOffsetF ?? 0;

  if (concentrate.surface_temp_optimal_f == null) {
    const reason = concentrate.blocked ?? 'No surface_temp_optimal_f recorded.';
    throw new Error(
      `${concentrate.name} should not be dabbed: ${reason}`,
    );
  }

  const interiorF = concentrate.surface_temp_optimal_f;
  const wallModF = wall.modifier_f;
  const irOffsetF = sensorBranchOffsetF(sensor, banger);
  const displayedF = Math.round(interiorF + wallModF + irOffsetF + tuneOffsetF);
  const dunkF = recommendDunk(displayedF, sensor);

  // Trace lines mirror the META.calibration_explanation order.
  const trace: string[] = [
    `Interior surface: ${interiorF}°F (${concentrate.name})`,
    `Wall modifier: ${formatSign(wallModF)}°F (${wall.name})`,
  ];
  switch (sensor.method) {
    case 'contact':
      trace.push(`Sensor offset: 0°F (${sensor.name} — surface truth)`);
      break;
    case 'ir':
    case 'visual':
      trace.push(
        `Sensor offset: ${formatSign(irOffsetF)}°F (${banger.geometry}-class · ${banger.ir_offset_sign} × ${banger.ir_offset_f})`,
      );
      break;
    case 'enail':
      trace.push(
        `Sensor offset: ${formatSign(irOffsetF)}°F (PID midpoint, ${banger.geometry === 'enail' ? banger.name : 'fallback +50°F'})`,
      );
      break;
  }
  if (tuneOffsetF !== 0) {
    trace.push(`Tune nudge: ${formatSign(tuneOffsetF)}°F`);
  }
  trace.push(`Displayed target: ${displayedF}°F`);
  trace.push(`Dunk alarm: ${dunkF}°F`);

  // Validate against the concentrate's documented surface_temp_range_f.
  const warnings: string[] = [];
  const range = concentrate.surface_temp_range_f;
  if (range != null) {
    const [low, high] = range;
    const projectedInterior = interiorF + tuneOffsetF;
    if (projectedInterior < low) {
      warnings.push(
        `Interior ${projectedInterior}°F is below ${concentrate.name}'s range (${low}-${high}°F).`,
      );
    } else if (projectedInterior > high) {
      warnings.push(
        `Interior ${projectedInterior}°F is above ${concentrate.name}'s range (${low}-${high}°F).`,
      );
    }
  }

  return {
    interiorF,
    wallModF,
    irOffsetF,
    tuneOffsetF,
    displayedF,
    dunkF,
    trace,
    warnings,
  };
}

/**
 * Inverse calibration — given a displayed target, recover the implied
 * interior surface temp for the (banger, sensor, wall) tuple.
 *
 * Useful for sanity-checking presets and round-tripping the schema examples.
 */
export function inverseInterior(args: {
  readonly displayedF: number;
  readonly banger: Banger;
  readonly sensor: Sensor;
  readonly wall: WallThickness;
}): number {
  const offset = sensorBranchOffsetF(args.sensor, args.banger);
  return args.displayedF - args.wall.modifier_f - offset;
}

/**
 * Dunk-alarm recommendation. Mirrors the existing wizard logic of
 * `clamp(displayed - 280, 200, 320)`, but for e-nail sensors we keep dunk at
 * 250°F since e-nails don't dunk-cool meaningfully.
 */
export function recommendDunk(displayedF: number, sensor: Sensor): number {
  if (sensor.method === 'enail') return ENAIL_DUNK_F;
  const raw = displayedF - DUNK_DROP_F;
  return Math.max(DUNK_MIN_F, Math.min(DUNK_MAX_F, raw));
}

/**
 * Cold start is available iff:
 *   - the concentrate is dabbable AND `good_for_cold_start === true`, AND
 *   - the banger's `cold_start_compatible !== 'NO'`.
 *
 * `OPTIONAL` and `YES` both pass.
 */
export function coldStartAvailable(concentrate: Concentrate, banger: Banger): boolean {
  if (concentrate.surface_temp_optimal_f == null) return false;
  if (concentrate.blocked != null) return false;
  if (!concentrate.good_for_cold_start) return false;
  if (banger.cold_start_compatible === 'NO') return false;
  return true;
}
