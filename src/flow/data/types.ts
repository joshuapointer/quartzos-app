export type BangerGeometry = 'bucket' | 'slurper' | 'insert' | 'enail';
export type BangerCategory = 'classic' | 'slurper' | 'specialty' | 'premium';
export type ColdStartCompat = 'YES' | 'NO' | 'OPTIONAL';
export type TorchPattern =
  | 'circular_sweep'
  | 'circular_sweep_outer_only'
  | 'circular_sweep_floor'
  | 'sequenced'
  | 'simultaneous_sweep';

export type Banger = {
  id: string;
  name: string;
  category: BangerCategory;
  geometry: BangerGeometry;
  description: string;
  surface_range: [number, number];
  /** Signed °F gradient lag at standard wall (v2 metrology — replaces ir_offset_f/sign). */
  gradient_lag_f: number;
  /** 1.0 clear quartz · 0.2 opaque w/ Dab Rite preset · 0 e-nail. */
  emissivity_bias_multiplier: number;
  ir_aim: string;
  heat_time: string;
  heat_seconds: [number, number];
  cool_seconds: [number, number];
  cooling?: { k_per_second: number | null; thermal_class: string };
  pattern: TorchPattern;
  zones: { anatomy: string; pct: number }[];
  torch_distance: string;
  visual_cue: string;
  cold_start: ColdStartCompat;
  tags: string[];
  mfr_targets?: { solventless?: number; hydrocarbon?: number };
  mfrs: string[];
};

export type ConcentrateCat = 'Solventless' | 'Hash' | 'Hydrocarbon' | 'Distillate' | 'Novel';

export type Concentrate = {
  id: string;
  name: string;
  cat: ConcentrateCat;
  description: string;
  surface_range: [number, number] | null;
  surface_optimal: number | null;
  /** v2 metrology: T_Ideal — fluid contact target before phase-change load. */
  fluid_target_optimal: number | null;
  /** v2 metrology: low/high fluid target range. */
  fluid_target_range: [number, number] | null;
  terps: 'high' | 'med' | 'low' | 'none';
  cold_start_good: boolean;
  notes?: string[];
  warning?: string;
  blocked?: string;
  confidence: string;
  tags: string[];
};

export type Sensor = {
  id: 'ir';
  name: string;
  short: string;
  method: 'ir';
  description: string;
  calibration: string;
  /** v2 metrology: sensor's emissivity bias in °F (IR ≈ +15, contact = 0). */
  emissivity_bias_f: number;
  /** Whether this sensor's reading should include the dT_Gradient term. */
  applies_gradient_lag: boolean;
};

export type Wall = {
  id: 'thin' | 'standard' | 'thick' | 'unknown';
  name: string;
  thickness: string;
  mod: number;
  /** v2 metrology: scales banger.gradient_lag_f. Thin 0.5 · Std 1.0 · Thick 1.6. */
  gradient_multiplier: number;
  description: string;
};

export type SavedPreset = {
  id: string;
  name: string;
  kind: 'quartz' | 'opaque' | 'low' | 'custom';
  banger: string;
  concentrate: string;
  sensor: 'ir';
  wall: string;
  builtin: boolean;
  desc: string;
};

export type CalibResult = {
  surface: number;
  ir: number;
  wall: number;
  displayed: number;
  low: number;
  high: number;
  dunk: number;
  override?: { source: string; surface: number; reason: string };
};

export type OrbStage =
  | 'idle'
  | 'heat'
  | 'cool'
  | 'ready'
  | 'dab'
  | 'done';

export type OrbPhase = 'pre' | 'active' | 'post';

export type SessionState = {
  banger?: Banger | null;
  concentrate?: Concentrate | null;
  wall?: Wall | null;
  calibration?: CalibResult | null;
  elapsedSeconds?: number;
  currentTemp?: number | null;
};

export type OrbProps = {
  color: string;
  glowColor: string;
  pulseScale: number;
  label: string;
  sublabel: string;
  showTemp: boolean;
};
