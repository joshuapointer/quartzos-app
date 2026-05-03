import type { Sensor } from './types';

export const SENSORS: Sensor[] = [
  {
    id: 'ir',
    name: 'Dab Rite IR',
    short: 'Dab Rite Pro · non-contact infrared',
    method: 'ir',
    description: 'Non-contact infrared. Aim per banger geometry — bucket vs slurper read differently.',
    calibration: 'Four-term v2 metrology: T_Ideal + dT_Load + dT_Gradient + dT_emissivity.',
    emissivity_bias_f: 15,
    applies_gradient_lag: true,
  },
];
