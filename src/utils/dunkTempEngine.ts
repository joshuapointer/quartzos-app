/**
 * Dunk-temperature derivation engine.
 *
 * Derives the dunk alarm temp purely from physical constants in
 * docs/perfect_dab/schema.json `calibration.constants`:
 *
 *     dunk_surface_f = ambient_temp_f + 2 × phase_change_load_f
 *                    = 72 + 2 × 65
 *                    = 202 °F
 *
 * Rationale:
 *   - Above this temp the banger surface still has > 1 phase-change-load
 *     of headroom, so swab residue stays soft enough to lift cleanly.
 *   - Below this temp, vapor production is impossible (interior surface is
 *     deeper than one phase-change load above ambient = oil cannot reach its
 *     boil point even on contact).
 *   - The threshold is a property of the banger ↔ ambient delta, NOT of the
 *     concentrate, so a single derivation applies across the catalog.
 *
 * The engine then converts surface-space to sensor-display-space by adding
 * the same dab-time offset the calibration engine applied (gradient + emissivity
 * for IR; PID coil offset for e-nail; zero for contact / visual).
 *
 * Output is rounded to nearest 5 °F and clamped to [150, 320] °F so the
 * AlarmService's BLE-encoded dunk threshold remains in a defensible band.
 */

import type { Sensor } from '../data/sensors';
import { CALIBRATION_CONSTANTS } from '../data/calibrationConstants';

const DUNK_FLOOR_F = 150;
const DUNK_CEIL_F = 320;

/**
 * Surface-space dunk target derived from `ambient_temp_f + 2 × phase_change_load_f`.
 * Constant across all concentrates / bangers — purely a physics floor.
 */
export function dunkSurfaceF(): number {
  const C = CALIBRATION_CONSTANTS;
  return C.ambient_temp_f + 2 * C.phase_change_load_f;
}

/**
 * Sensor-display dunk alarm.
 *
 * @param sensor          Selected sensor.
 * @param dabSensorDelta  Sensor-space offset applied to the dab target
 *                        (`displayedDabF − surfaceDabF`). Reused so the dunk
 *                        alarm fires at the correct number for the sensor in use.
 *                        Pass 0 when only surface space is needed.
 */
export function dunkDisplayedF(sensor: Sensor, dabSensorDelta: number): number {
  const raw = dunkSurfaceF() + dabSensorDelta;
  const rounded = Math.round(raw / 5) * 5;
  const clamped = Math.max(DUNK_FLOOR_F, Math.min(DUNK_CEIL_F, rounded));
  // Touch sensor argument so callers that mistakenly pass an unrelated object
  // still typecheck — kept for future per-sensor overrides.
  void sensor;
  return clamped;
}
