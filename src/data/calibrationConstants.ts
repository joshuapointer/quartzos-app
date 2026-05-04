/**
 * Physical constants used by the perfect-dab derivation engine.
 *
 * Source: docs/perfect_dab/schema.json `calibration.constants`.
 * Every magic number consumed by `src/utils/calibration.ts`,
 * `src/utils/dabWindowEngine.ts`, `src/utils/dunkTempEngine.ts`,
 * and `src/utils/torchTimeEngine.ts` should resolve here — no
 * unanchored constants in the engine code.
 */

export interface FusedSilicaProperties {
  readonly thermal_conductivity_w_per_mk: number;
  readonly density_kg_per_m3: number;
  readonly specific_heat_j_per_kgk: number;
  readonly thermal_diffusivity_m2_per_s: number;
  readonly spectral_emissivity_400_600f: number;
  readonly coefficient_of_thermal_expansion_per_c: number;
}

export interface CalibrationConstants {
  /** Instantaneous interior-surface temperature drop when a 0.1-0.2 g cold extract mass + cap contacts the banger. */
  readonly phase_change_load_f: number;
  /** ±°F tolerance band around the phase-change load (varies with dab volume). */
  readonly phase_change_load_tolerance_f: number;
  /** Room ambient — anchor for Newton's-law cooling and for the dunk-target derivation. */
  readonly ambient_temp_f: number;
  /** Surface temp at torch-off (just past faint glow) — anchor for cooling integrations. */
  readonly torch_off_temp_f: number;
  /** Thermophysical properties of fused silica — used for Fourier-law gradient lag derivation. */
  readonly fused_silica: FusedSilicaProperties;
}

export const CALIBRATION_CONSTANTS: CalibrationConstants = {
  phase_change_load_f: 65,
  phase_change_load_tolerance_f: 15,
  ambient_temp_f: 72,
  torch_off_temp_f: 700,
  fused_silica: {
    thermal_conductivity_w_per_mk: 1.4,
    density_kg_per_m3: 2200,
    specific_heat_j_per_kgk: 730,
    thermal_diffusivity_m2_per_s: 8.71e-7,
    spectral_emissivity_400_600f: 0.92,
    coefficient_of_thermal_expansion_per_c: 5.5e-7,
  },
} as const;
