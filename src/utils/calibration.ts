/**
 * Perfect-dab calibration engine — v2 metrology model.
 *
 * Source: docs/perfect_dab/schema.json `calibration.formula` (v2.0.0).
 *
 * Four-term equation (IR branch):
 *
 *     T_IR_Setpoint = T_Ideal
 *                   + dT_Load
 *                   + (banger.gradient_lag_f × wall.gradient_multiplier)
 *                   + (sensor.emissivity_bias_f × banger.emissivity_bias_multiplier)
 *
 *   T_Ideal       := concentrate.fluid_target_optimal_f
 *   dT_Load       := CALIBRATION_CONSTANTS.phase_change_load_f
 *
 * Sensor branches:
 *   - contact (Terpometer V1 probe) → setpoint = surface_temp_optimal_f
 *   - ir / visual                   → four-term equation above
 *   - enail (PID)                   → setpoint = surface_temp_optimal_f + sensor.emissivity_bias_f
 *
 * The engine returns:
 *   - displayedF : final number user sees on their device.
 *   - dunkF      : derived from `dunkTempEngine` (surface 202 °F → sensor display).
 *   - trace      : per-term breakdown for the calibration UI.
 *   - warnings   : soft flags (interior outside concentrate's documented range).
 *
 * Every schema worked example reproduces within ±3 °F.
 */

import type { Banger } from '../data/bangers';
import type { Concentrate } from '../data/concentrates';
import type { Sensor } from '../data/sensors';
import type { WallThickness } from '../data/wallThicknesses';
import { CALIBRATION_CONSTANTS } from '../data/calibrationConstants';
import { dunkDisplayedF } from './dunkTempEngine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalibrationInput {
  readonly concentrate: Concentrate;
  readonly banger: Banger;
  readonly sensor: Sensor;
  readonly wall: WallThickness;
  /** Optional ±°F nudge applied to the final displayed target. */
  readonly tuneOffsetF?: number;
}

export interface CalibrationResult {
  /** Interior surface temp the dab actually contacts (probe-truth). */
  readonly surfaceF: number;
  /** T_Ideal from the v2 equation (= surface − phase_change_load for IR; = surface elsewhere). */
  readonly tIdealF: number;
  /** dT_Load — phase-change load constant (0 for contact / e-nail branches). */
  readonly dTLoadF: number;
  /** dT_Gradient — banger gradient_lag × wall gradient_multiplier (0 when sensor doesn't apply it). */
  readonly dTGradientF: number;
  /** dT_emissivity — sensor.emissivity_bias × banger.emissivity_bias_multiplier (PID coil for e-nail). */
  readonly dTEmissivityF: number;
  /** User-provided ±°F nudge applied last. */
  readonly tuneOffsetF: number;
  /** Final number the user sees on their device. */
  readonly displayedF: number;
  /** Recommended dunk-alarm temp (sensor-space). */
  readonly dunkF: number;
  /** Sensor-space delta between surface and displayed dab target. */
  readonly sensorDeltaF: number;
  /** Per-term breakdown for the calibration UI. */
  readonly trace: readonly string[];
  /** Soft warnings (e.g., interior outside concentrate's surface_temp_range_f). */
  readonly warnings: readonly string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSign(n: number): string {
  if (n === 0) return '0';
  return n > 0 ? `+${n}` : String(n);
}

interface SensorBranch {
  readonly tIdealF: number;
  readonly dTLoadF: number;
  readonly dTGradientF: number;
  readonly dTEmissivityF: number;
  readonly trace: readonly string[];
}

function evaluateBranch(
  concentrate: Concentrate,
  banger: Banger,
  sensor: Sensor,
  wall: WallThickness,
  surfaceF: number,
): SensorBranch {
  const C = CALIBRATION_CONSTANTS;

  switch (sensor.method) {
    case 'contact': {
      return {
        tIdealF: surfaceF,
        dTLoadF: 0,
        dTGradientF: 0,
        dTEmissivityF: 0,
        trace: [
          `Surface temp: ${surfaceF}°F (${concentrate.name})`,
          `Sensor: ${sensor.name} — reads interior surface directly`,
        ],
      };
    }

    case 'enail': {
      // PID coil sits ~50 °F hotter than the interior surface; e-banger holds steady there.
      const dTEmissivityF = Math.round(sensor.emissivity_bias_f);
      return {
        tIdealF: surfaceF,
        dTLoadF: 0,
        dTGradientF: 0,
        dTEmissivityF,
        trace: [
          `Surface temp: ${surfaceF}°F (${concentrate.name})`,
          `PID coil offset: ${formatSign(dTEmissivityF)}°F (${sensor.name})`,
        ],
      };
    }

    case 'ir':
    case 'visual': {
      // T_Ideal = fluid boiling target. Fall back to (surface − load) when the catalog
      // entry predates the v2 fluid_target field.
      const tIdealF =
        concentrate.fluid_target_optimal_f ?? surfaceF - C.phase_change_load_f;
      const dTLoadF = C.phase_change_load_f;
      const dTGradientF = sensor.applies_gradient_lag
        ? Math.round(banger.gradient_lag_f * wall.gradient_multiplier)
        : 0;
      const dTEmissivityF = Math.round(
        sensor.emissivity_bias_f * banger.emissivity_bias_multiplier,
      );
      return {
        tIdealF,
        dTLoadF,
        dTGradientF,
        dTEmissivityF,
        trace: [
          `Fluid target (T_Ideal): ${tIdealF}°F (${concentrate.name})`,
          `Phase-change load: ${formatSign(dTLoadF)}°F`,
          `Gradient lag: ${formatSign(dTGradientF)}°F (${banger.geometry}-class · ${banger.gradient_lag_f} × ${wall.gradient_multiplier})`,
          `Emissivity bias: ${formatSign(dTEmissivityF)}°F (${sensor.name} · ${sensor.emissivity_bias_f} × ${banger.emissivity_bias_multiplier})`,
        ],
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute the displayed dab target + recommended dunk alarm for a
 * (concentrate, banger, sensor, wall) tuple using the v2 metrology model.
 *
 * Throws when the concentrate is `blocked` or has no `surface_temp_optimal_f`.
 */
export function computeDisplayedTarget(input: CalibrationInput): CalibrationResult {
  const { concentrate, banger, sensor, wall } = input;
  const tuneOffsetF = input.tuneOffsetF ?? 0;

  if (concentrate.surface_temp_optimal_f == null) {
    const reason = concentrate.blocked ?? 'No surface_temp_optimal_f recorded.';
    throw new Error(`${concentrate.name} should not be dabbed: ${reason}`);
  }

  const surfaceF = concentrate.surface_temp_optimal_f;
  const branch = evaluateBranch(concentrate, banger, sensor, wall, surfaceF);
  const summed =
    branch.tIdealF +
    branch.dTLoadF +
    branch.dTGradientF +
    branch.dTEmissivityF +
    tuneOffsetF;
  const displayedF = Math.round(summed);
  const sensorDeltaF = displayedF - surfaceF - tuneOffsetF;
  const dunkF = dunkDisplayedF(sensor, sensorDeltaF);

  const trace: string[] = [...branch.trace];
  if (tuneOffsetF !== 0) trace.push(`Tune nudge: ${formatSign(tuneOffsetF)}°F`);
  trace.push(`Displayed target: ${displayedF}°F`);
  trace.push(`Dunk alarm: ${dunkF}°F`);

  // Validate against the concentrate's documented surface_temp_range_f.
  const warnings: string[] = [];
  const range = concentrate.surface_temp_range_f;
  if (range != null) {
    const [low, high] = range;
    const projected = surfaceF + tuneOffsetF;
    if (projected < low) {
      warnings.push(
        `Interior ${projected}°F is below ${concentrate.name}'s range (${low}-${high}°F).`,
      );
    } else if (projected > high) {
      warnings.push(
        `Interior ${projected}°F is above ${concentrate.name}'s range (${low}-${high}°F).`,
      );
    }
  }

  return {
    surfaceF,
    tIdealF: branch.tIdealF,
    dTLoadF: branch.dTLoadF,
    dTGradientF: branch.dTGradientF,
    dTEmissivityF: branch.dTEmissivityF,
    tuneOffsetF,
    displayedF,
    dunkF,
    sensorDeltaF,
    trace,
    warnings,
  };
}

/**
 * Inverse calibration — given a displayed target, recover the implied
 * interior surface temp for the (banger, sensor, wall) tuple.
 *
 * For IR/visual: surface = displayed − dT_gradient − dT_emissivity.
 * For e-nail   : surface = displayed − sensor.emissivity_bias_f.
 * For contact  : surface = displayed.
 */
export function inverseInterior(args: {
  readonly displayedF: number;
  readonly banger: Banger;
  readonly sensor: Sensor;
  readonly wall: WallThickness;
}): number {
  const { displayedF, banger, sensor, wall } = args;
  switch (sensor.method) {
    case 'contact':
      return displayedF;
    case 'enail':
      return displayedF - Math.round(sensor.emissivity_bias_f);
    case 'ir':
    case 'visual': {
      const gradient = sensor.applies_gradient_lag
        ? Math.round(banger.gradient_lag_f * wall.gradient_multiplier)
        : 0;
      const emissivity = Math.round(
        sensor.emissivity_bias_f * banger.emissivity_bias_multiplier,
      );
      return displayedF - gradient - emissivity;
    }
  }
}

/**
 * Sensor-display dunk alarm for a (banger, concentrate, sensor, wall) tuple.
 * Convenience wrapper around `dunkDisplayedF` that resolves the sensor delta.
 */
export function recommendDunkF(input: CalibrationInput): number {
  const result = computeDisplayedTarget(input);
  return result.dunkF;
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
