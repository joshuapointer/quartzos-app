/**
 * Temperature measurement instruments. The sensor `method` selects the
 * calibration formula branch in `src/utils/calibration.ts`.
 *
 * Source: docs/ref/perfect_dab/sensors.json
 */

export type SensorMethod = 'contact' | 'ir' | 'enail' | 'visual';

export interface Sensor {
  readonly id: string;
  readonly name: string;
  readonly method: SensorMethod;
  readonly description: string;
  readonly calibration_note: string;
}

export const SENSORS: readonly Sensor[] = [
  {
    id: 'probe',
    name: 'Probe (Terpometer V1)',
    method: 'contact',
    description: 'Contact probe touches interior surface. Reads SURFACE TRUTH directly.',
    calibration_note: 'No offset applied — your reading IS the surface temp.',
  },
  {
    id: 'ir',
    name: 'IR Thermometer (Dab Rite Pro, Octave, Terpometer Gen 2)',
    method: 'ir',
    description:
      'Non-contact IR. Aim per banger geometry — bucket vs slurper-class read differently.',
    calibration_note:
      'Apply banger.ir_offset_sign * banger.ir_offset_f. Bucket-class subtracts (display lower than interior). Slurper-class adds (display higher than interior — thinner wall, direct flame contact). Cooldown-trigger workflow: dab on descent through target, NOT at peak torch.',
  },
  {
    id: 'enail',
    name: 'E-Nail PID Setpoint',
    method: 'enail',
    description:
      'Coil temp controller. Set & forget. Coil reads 30-80°F higher than surface (varies by brand).',
    calibration_note:
      'Add ~50°F midpoint to surface target. MiniNail-on-MiniNail is factory-calibrated to display surface temp directly — set PID to surface target, not the +50°F estimate.',
  },
  {
    id: 'visual',
    name: 'No Thermometer (Visual / Timing)',
    method: 'visual',
    description: 'Glow + count method. Approximate. App estimates based on form factor.',
    calibration_note:
      'Use IR-equivalent values as approximate guidance. Visual cue (banger.visual_cue) is the primary signal.',
  },
] as const;

export function findSensor(id: string): Sensor | undefined {
  return SENSORS.find((s) => s.id === id);
}
