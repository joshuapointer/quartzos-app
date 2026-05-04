/**
 * Temperature measurement instruments. The sensor `method` selects the
 * calibration formula branch in `src/utils/calibration.ts`.
 *
 * Source: docs/perfect_dab/sensors.json (v2.0.0).
 *
 * v2 fields:
 *   - `emissivity_bias_f` — firmware-vs-material emissivity calculation error.
 *     For IR (Dab Rite Pro v2.2): 15°F (firmware ε=0.95 vs. quartz ε≈0.92).
 *     For e-nail (PID): 50°F repurposed as coil-vs-surface offset midpoint.
 *     For contact/visual: 0.
 *   - `applies_gradient_lag` — only IR triggers the dT_Gradient term.
 */

export type SensorMethod = 'contact' | 'ir' | 'enail' | 'visual';

export interface Sensor {
  readonly id: string;
  readonly name: string;
  readonly method: SensorMethod;
  readonly emissivity_bias_f: number;
  readonly applies_gradient_lag: boolean;
  readonly description: string;
  readonly calibration_note: string;
}

export const SENSORS: readonly Sensor[] = [
  {
    id: 'probe',
    name: 'Probe (Terpometer V1)',
    method: 'contact',
    emissivity_bias_f: 0,
    applies_gradient_lag: false,
    description:
      'Contact thermocouple touches the interior quartz floor. Reads SURFACE TRUTH directly via physical conduction.',
    calibration_note:
      'No offsets applied — your reading IS the interior surface temp. Setpoint = concentrate.surface_temp_optimal_f directly.',
  },
  {
    id: 'ir',
    name: 'IR Thermometer (Dab Rite Pro v2.2, Octave, Terpometer Gen 2)',
    method: 'ir',
    emissivity_bias_f: 15,
    applies_gradient_lag: true,
    description:
      'Non-contact IR thermopile. Aim per banger geometry — bucket-class reads exterior floor (cooler than interior during cooldown), slurper-class reads side-of-column (closer to interior). Firmware ε_set=0.95; clear quartz ε_actual≈0.92.',
    calibration_note:
      'Apply both dT_Gradient (banger geometry × wall thickness) and dT_emissivity (firmware-vs-material bias). The 0.03 emissivity mismatch causes ~15°F under-reporting at typical dab temperatures. Workflow: dab on descent through target, NOT at peak torch.',
  },
  {
    id: 'enail',
    name: 'E-Nail PID Setpoint',
    method: 'enail',
    emissivity_bias_f: 50,
    applies_gradient_lag: false,
    description:
      'Coil temperature controller. Set-and-forget. Coil reads 30-80°F higher than interior surface (varies by brand). emissivity_bias_f repurposed as coil-vs-surface offset midpoint.',
    calibration_note:
      'Add ~50°F midpoint to surface_temp_optimal_f. MiniNail-on-MiniNail is factory-calibrated to display surface temp directly — set PID to surface target, not the +50°F estimate.',
  },
  {
    id: 'visual',
    name: 'No Thermometer (Visual / Timing)',
    method: 'visual',
    emissivity_bias_f: 0,
    applies_gradient_lag: false,
    description:
      'Glow + count method. Approximate. App estimates from form factor and cooldown_seconds.',
    calibration_note:
      'Use IR-equivalent values as approximate guidance. Visual cue (banger.visual_cue) is the primary signal.',
  },
] as const;

export function findSensor(id: string): Sensor | undefined {
  return SENSORS.find((s) => s.id === id);
}
