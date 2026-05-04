/**
 * Barrel module re-exporting the four perfect-dab catalogs plus the META block
 * (units, calibration formula, data sources, confidence levels, examples) and
 * enum constants.
 *
 * Source: docs/perfect_dab/schema.json (v2.0.0).
 */

export {
  BANGERS,
  findBanger,
  type Banger,
  type BangerId,
  type BangerCategory,
  type BangerGeometry,
  type BucketBanger,
  type SlurperBanger,
  type InsertBanger,
  type EnailBanger,
  type ColdStartCompatibility,
  type TorchPattern,
  type TorchZone,
  type HeatTimeStage,
  type CoolingProfile,
} from './bangers';

export {
  CONCENTRATES,
  findConcentrate,
  isDabbable,
  type Concentrate,
  type ConcentrateId,
  type ConcentrateCategory,
  type TerpeneProfile,
} from './concentrates';

export {
  SENSORS,
  findSensor,
  type Sensor,
  type SensorMethod,
} from './sensors';

export {
  WALL_THICKNESSES,
  findWallThickness,
  type WallThickness,
  type WallThicknessId,
} from './wallThicknesses';

export {
  CALIBRATION_CONSTANTS,
  type CalibrationConstants,
  type FusedSilicaProperties,
} from './calibrationConstants';

// ---------------------------------------------------------------------------
// META — sourced from schema.json (meta + calibration blocks, v2.0.0)
// ---------------------------------------------------------------------------

export interface CalibrationExample {
  readonly scenario: string;
  readonly math: string;
  readonly displayed_target_f: number;
}

export interface DabMeta {
  readonly name: string;
  readonly version: string;
  readonly release_date: string;
  readonly description: string;
  readonly license: string;
  readonly units: {
    readonly temperature: 'fahrenheit';
    readonly distance: 'inches';
    readonly time: 'seconds';
    readonly wall_thickness: 'millimeters';
  };
  readonly temperature_convention: string;
  readonly calibration_formula: string;
  readonly calibration_explanation: readonly string[];
  readonly calibration_examples: readonly CalibrationExample[];
  readonly calibration_workflow_note: string;
  readonly data_sources: readonly string[];
  readonly confidence_levels: { readonly [key: string]: string };
}

export const META: DabMeta = {
  name: 'QuartzOS Reference Data',
  version: '2.0.0',
  release_date: '2026-04-28',
  description:
    'Production-grade reference data for cannabis concentrate dabbing. The v2 four-term metrology model derives every dab parameter from physical constants and per-banger / per-concentrate / per-sensor / per-wall coefficients, replacing the v1 fused single-offset.',
  license:
    'Open data for non-commercial integration. Verify temperature recommendations against current community testing before production deployment.',
  units: {
    temperature: 'fahrenheit',
    distance: 'inches',
    time: 'seconds',
    wall_thickness: 'millimeters',
  },
  temperature_convention:
    'Two anchors: surface_temp_optimal_f (interior probe-truth) and fluid_target_optimal_f (boiling target of oil; surface − phase_change_load).',
  calibration_formula:
    'T_IR_Setpoint = T_Ideal + dT_Load + (banger.gradient_lag_f × wall.gradient_multiplier) + (sensor.emissivity_bias_f × banger.emissivity_bias_multiplier)',
  calibration_explanation: [
    '1. T_Ideal := concentrate.fluid_target_optimal_f (boiling target of the oil itself).',
    '2. dT_Load := CALIBRATION_CONSTANTS.phase_change_load_f (cold-mass + cap heat-sink, ~65°F).',
    '3. dT_Gradient := banger.gradient_lag_f × wall.gradient_multiplier (Fourier conduction lag).',
    '4. dT_emissivity := sensor.emissivity_bias_f × banger.emissivity_bias_multiplier (firmware ε vs. material ε).',
    '5. Contact probe: setpoint = surface_temp_optimal_f directly.',
    '6. E-nail PID: setpoint = surface_temp_optimal_f + sensor.emissivity_bias_f (coil-vs-surface midpoint).',
  ],
  calibration_examples: [
    {
      scenario: 'Live Rosin · Flat Top · Dab Rite IR · Std (4mm clear)',
      math: '415 + 65 + 25 (gradient) + 15 (emissivity) = 520°F',
      displayed_target_f: 520,
    },
    {
      scenario: 'Live Rosin · Opaque Bottom · Dab Rite IR (Opaque preset) · Std',
      math: '415 + 65 + 35 (gradient) + 3 (emissivity, Opaque preset) = 518°F',
      displayed_target_f: 518,
    },
    {
      scenario: 'Cured Shatter · Flat Top · Dab Rite IR · Thin (2mm)',
      math: '480 + 65 + 13 (25 × 0.5) + 15 (emissivity) ≈ 573°F',
      displayed_target_f: 573,
    },
    {
      scenario: 'Live Rosin · Flat Top · Terpometer V1 contact probe',
      math: '480 (surface) = 480°F displayed',
      displayed_target_f: 480,
    },
    {
      scenario: 'Live Rosin · Blender slurper · Dab Rite IR · Std',
      math: '415 + 65 + 15 (gradient) + 15 (emissivity) = 510°F',
      displayed_target_f: 510,
    },
    {
      scenario: 'Live Rosin · E-Banger PID · Std',
      math: '480 (surface) + 50 (PID coil offset) = 530°F',
      displayed_target_f: 530,
    },
  ],
  calibration_workflow_note:
    "For IR-mode users: the Dab Rite alarms when temp DESCENDS through the set point. Torch past the displayed target, pull the flame, then dab when the alarm fires on the way down. Don't dab AT peak torch.",
  data_sources: [
    'Dab Rite official documentation and 2025 placement guide (dabrite.com)',
    'Highly Educated Control Tower FAQ (highlyeducatedti.com)',
    'Honeybee Herb product documentation (honeybeeherb.com)',
    'Mood blog torch + temperature guides (mood.com)',
    '420 VapeZone empirical Dab Rite + slurper testing',
    '710 Labs solventless temperature guidance',
    'Press Club temple ball / hash temp guidance',
    'Quave Club Banger product documentation',
    'Hashwriter community Terpometer averages',
    'Reddit r/Dabs, r/QuartzBangers, r/COents technique threads (2024-2026)',
    'Thermophysical properties of fused silica (k=1.4 W/m·K, ρ=2200 kg/m³, Cp=730 J/kg·K, ε≈0.92 at 400-600°F)',
    'Stefan-Boltzmann radiometric analysis of Dab Rite Pro v2.2 firmware (ε_set=0.95)',
  ],
  confidence_levels: {
    S: 'peer-reviewed scientific source',
    M: 'manufacturer-published (primary source)',
    B: 'brand/extractor-published',
    C: 'community consensus (multi-source convergence)',
    E: 'empirically tested (controlled measurement)',
    A: 'anecdotal / single source',
  },
} as const;

// ---------------------------------------------------------------------------
// Enums (schema.enums)
// ---------------------------------------------------------------------------

export interface EnumOption {
  readonly id: string;
  readonly label: string;
}

export interface BangerGeometryOption extends EnumOption {
  readonly gradient_lag_direction: 'positive' | 'positive_small' | 'none';
  readonly description: string;
}

export const BANGER_CATEGORIES: readonly EnumOption[] = [
  { id: 'classic', label: 'Classic' },
  { id: 'slurper', label: 'Slurper Class' },
  { id: 'specialty', label: 'Specialty' },
  { id: 'premium', label: 'Premium' },
] as const;

export const BANGER_GEOMETRIES: readonly BangerGeometryOption[] = [
  {
    id: 'bucket',
    label: 'Bucket-class',
    gradient_lag_direction: 'positive',
    description:
      'Exterior measurement face cools faster than interior — IR reads lower than dab interface during cooldown.',
  },
  {
    id: 'slurper',
    label: 'Slurper-class',
    gradient_lag_direction: 'positive_small',
    description: 'Side-of-column aim. Thin wall, small gradient lag.',
  },
  {
    id: 'insert',
    label: 'Insert workflow',
    gradient_lag_direction: 'positive',
    description: 'Read host banger temp + extra gradient through insert.',
  },
  {
    id: 'enail',
    label: 'E-nail (electric)',
    gradient_lag_direction: 'none',
    description:
      'PID setpoint; coil-vs-surface offset handled in sensor.emissivity_bias_f.',
  },
] as const;

export const CONCENTRATE_CATEGORIES: readonly EnumOption[] = [
  { id: 'solventless', label: 'Solventless' },
  { id: 'hash', label: 'Hash' },
  { id: 'hydrocarbon', label: 'Hydrocarbon' },
  { id: 'distillate', label: 'Distillate' },
  { id: 'novel', label: 'Novel / 2026' },
] as const;

export const TORCH_PATTERNS: readonly EnumOption[] = [
  { id: 'circular_sweep', label: 'Circular sweep — keep flame moving' },
  { id: 'circular_sweep_outer_only', label: 'Circular sweep — OUTER WALL ONLY' },
  { id: 'circular_sweep_floor', label: 'Circular sweep — focus floor, not pillar' },
  { id: 'sequenced', label: 'Sequenced — dish → column → dish' },
  { id: 'simultaneous_sweep', label: 'Simultaneous side-to-side + top-to-bottom' },
  { id: 'none', label: 'No torch (electric)' },
] as const;
