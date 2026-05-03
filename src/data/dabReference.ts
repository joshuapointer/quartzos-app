/**
 * Barrel module re-exporting the four perfect-dab catalogs plus the META block
 * (units, calibration formula, data sources, confidence levels, examples) and
 * enum constants — sourced verbatim from docs/perfect_dab/schema.json.
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
  type IrOffsetSign,
  type TorchPattern,
  type TorchZone,
  type HeatTimeStage,
} from './bangers';

export {
  CONCENTRATES,
  findConcentrate,
  isDabbable,
  type Concentrate,
  type ConcentrateId,
  type ConcentrateCategory,
  type TerpeneProfile,
  type SolventlessConcentrate,
  type HydrocarbonConcentrate,
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

// ---------------------------------------------------------------------------
// META — sourced from schema.json (meta + calibration blocks)
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
  version: '1.0.0',
  release_date: '2026-04-27',
  description:
    'Production-grade reference data for cannabis concentrate dabbing — banger form factors, concentrates, sensors, and temperature calibrations. Sourced from manufacturer documentation (Dab Rite, Highly Educated, Quave, Honeybee Herb), brand guidance (710 Labs, Mood, Press Club), and 2025-2026 community consensus.',
  license:
    'Open data for non-commercial integration. Verify temperature recommendations against current community testing before production deployment.',
  units: {
    temperature: 'fahrenheit',
    distance: 'inches',
    time: 'seconds',
    wall_thickness: 'millimeters',
  },
  temperature_convention:
    'All concentrate.surface_temp_f values are INTERIOR SURFACE temperatures (probe-truth, Terpometer V1 contact). Sensor readings on instruments differ — use the sensor + banger.ir_offset_f + banger.ir_offset_sign math to convert.',
  calibration_formula:
    'displayed_temp = interior_surface_temp + (banger.ir_offset_sign * banger.ir_offset_f) + wall.modifier_f',
  calibration_explanation: [
    '1. Start with concentrate.surface_temp_optimal_f (interior surface — what the dab actually contacts)',
    '2. Apply wall.modifier_f (thicker walls hold more heat, target slightly higher)',
    '3. Multiply banger.ir_offset_f by banger.ir_offset_sign (-1 for bucket-class, +1 for slurper-class, 0 for e-nail)',
    "4. Add result to surface temp to get the displayed temp on the user's instrument",
  ],
  calibration_examples: [
    {
      scenario: 'Live Resin + Flat Top + IR + Standard wall',
      math: '510 (interior) + 0 (wall) + (-1 * 35) (bucket-class IR offset) = 475°F displayed on Dab Rite',
      displayed_target_f: 475,
    },
    {
      scenario: 'Live Resin + Blender + IR + Standard wall',
      math: '510 (interior) + 0 (wall) + (+1 * 20) (slurper-class IR offset) = 530°F displayed on Dab Rite',
      displayed_target_f: 530,
    },
    {
      scenario: 'Cold Cure Rosin + Terp Slurper + IR + Standard wall',
      math: '460 (interior) + 0 (wall) + (+1 * 20) (slurper-class IR offset) = 480°F displayed on Dab Rite',
      displayed_target_f: 480,
    },
    {
      scenario: 'Live Resin + Flat Top + Probe + Standard wall',
      math: '510 (interior) + 0 (wall) + 0 (probe is contact, no offset) = 510°F displayed on Terpometer',
      displayed_target_f: 510,
    },
    {
      scenario: 'Live Resin + E-Banger + PID + Standard wall',
      math: '510 (interior) + 0 (wall) + 50 (PID midpoint coil offset) = 560°F PID setpoint',
      displayed_target_f: 560,
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
    'Reddit r/Dabs, r/QuartzBangers technique threads (2024-2026)',
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
  readonly ir_offset_direction: 'negative' | 'positive' | 'none';
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
    ir_offset_direction: 'negative',
    description: 'IR display reads LOWER than interior surface',
  },
  {
    id: 'slurper',
    label: 'Slurper-class',
    ir_offset_direction: 'positive',
    description:
      'IR display reads HIGHER than interior surface (thin column wall, direct flame)',
  },
  {
    id: 'insert',
    label: 'Insert workflow',
    ir_offset_direction: 'negative',
    description: 'Read host banger temp, not insert directly',
  },
  {
    id: 'enail',
    label: 'E-nail (electric)',
    ir_offset_direction: 'none',
    description: 'PID setpoint, no torch, no IR needed',
  },
] as const;

export const CONCENTRATE_CATEGORIES: readonly EnumOption[] = [
  { id: 'solventless', label: 'Solventless' },
  { id: 'hydrocarbon', label: 'Hydrocarbon' },
] as const;

export const TORCH_PATTERNS: readonly EnumOption[] = [
  { id: 'circular_sweep', label: 'Circular sweep — keep flame moving' },
  { id: 'circular_sweep_outer_only', label: 'Circular sweep — OUTER WALL ONLY' },
  { id: 'circular_sweep_floor', label: 'Circular sweep — focus floor, not pillar' },
  { id: 'sequenced', label: 'Sequenced — dish → column → dish' },
  { id: 'simultaneous_sweep', label: 'Simultaneous side-to-side + top-to-bottom' },
  { id: 'none', label: 'No torch (electric)' },
] as const;
