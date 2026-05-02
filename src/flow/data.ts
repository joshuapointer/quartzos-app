// src/flow/data.ts — QuartzOS flow data module
// Ported from /tmp/quartzie-prototype/src/flow-data.jsx
// Source of truth for the new flow. Existing src/data/*.ts remain for legacy components.

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Bangers (14 entries) ────────────────────────────────────────────────────

export const BANGERS: Banger[] = [
  {
    id: 'flat-top',
    name: 'Flat Top',
    category: 'classic',
    geometry: 'bucket',
    description: 'Universal default. Cylindrical bucket, flat rim. ~80% of bangers in market.',
    surface_range: [500, 600],
    gradient_lag_f: 25,
    emissivity_bias_multiplier: 1.0,
    ir_aim: 'Center underside of bucket bottom, ½″ away',
    heat_time: '20–40s',
    heat_seconds: [20, 40],
    cool_seconds: [30, 45],
    pattern: 'circular_sweep',
    zones: [{ anatomy: 'bucket bottom', pct: 60 }, { anatomy: 'lower walls', pct: 40 }],
    torch_distance: '1–2″',
    visual_cue: 'Just shy of orange glow',
    cold_start: 'OPTIONAL',
    tags: ['CLASSIC'],
    mfrs: ['Quave', 'Toro', 'Highly Educated', 'Evan Shore', 'Honeybee Herb', 'Pulsar', 'MJ Arsenal'],
  },
  {
    id: 'beveled',
    name: 'Beveled Edge',
    category: 'classic',
    geometry: 'bucket',
    description: 'Inward-cut bevel for flush bubble cap seal. Better seal lets you target 20–40°F lower than non-beveled flat top.',
    surface_range: [480, 580],
    gradient_lag_f: 25,
    emissivity_bias_multiplier: 1.0,
    ir_aim: 'Center underside of bucket bottom, ½″ away',
    heat_time: '25–35s',
    heat_seconds: [25, 35],
    cool_seconds: [35, 50],
    pattern: 'circular_sweep',
    zones: [{ anatomy: 'bucket bottom', pct: 60 }, { anatomy: 'lower walls', pct: 40 }],
    torch_distance: '1–2″',
    visual_cue: 'Just barely glowing',
    cold_start: 'OPTIONAL',
    tags: ['CLASSIC', 'BETTER SEAL'],
    mfrs: ['Quave', 'Highly Educated Gavel', 'Evan Shore', 'Pulsar', 'Honeybee Herb'],
  },
  {
    id: 'opaque-bottom',
    name: 'Opaque Bottom',
    category: 'premium',
    geometry: 'bucket',
    description: 'Sandblasted/frosted bottom disc. Best IR accuracy of any banger. Use Dab Rite "Opaque Quartz" emissivity preset.',
    surface_range: [480, 560],
    gradient_lag_f: 35,
    emissivity_bias_multiplier: 0.2,
    ir_aim: 'Center of opaque bottom underside, ½″ away — switch IR to Opaque Quartz preset',
    heat_time: '30–40s',
    heat_seconds: [30, 40],
    cool_seconds: [45, 60],
    pattern: 'circular_sweep',
    zones: [{ anatomy: 'opaque bottom', pct: 70 }, { anatomy: 'lower walls', pct: 30 }],
    torch_distance: '1–2″',
    visual_cue: 'Faint side-wall glow only — opaque hides bottom glow',
    cold_start: 'OPTIONAL',
    tags: ['BEST IR ACCURACY', 'HIGH_GRADIENT_LAG'],
    mfrs: ['Evan Shore Opaque ESB', 'Highly Educated Gavel V3', 'Lavatech XL Opaque', 'Honeybee Herb Honey & Milk'],
  },
  {
    id: 'thermal',
    name: 'Thermal (Double Wall)',
    category: 'specialty',
    geometry: 'bucket',
    description: 'Air gap between walls insulates inner cup. IR reads cooler than actual oil contact temp because IR sees outer wall — compensate via timing.',
    surface_range: [500, 600],
    gradient_lag_f: 60,
    emissivity_bias_multiplier: 1.0,
    ir_aim: 'Outer base of bucket, ½″ away (manufacturer-correct aim)',
    heat_time: '30–45s',
    heat_seconds: [30, 45],
    cool_seconds: [45, 60],
    pattern: 'circular_sweep_outer_only',
    zones: [{ anatomy: 'outer side wall', pct: 70 }, { anatomy: 'outer bottom', pct: 30 }],
    torch_distance: '½–1″',
    visual_cue: 'No glow / faint outer corner only',
    cold_start: 'YES',
    tags: ['IR READS LOW'],
    mfrs: ['AFM Thermal', 'Pukinbeagle', 'Pulsar Thermal', 'Ooze'],
  },
  {
    id: 'round-bottom',
    name: 'Round Bottom',
    category: 'classic',
    geometry: 'bucket',
    description: 'Hemispherical interior, no corners. Best shape for terp pearls (rolls freely) and cold start (oil pools center).',
    surface_range: [500, 600],
    gradient_lag_f: 25,
    emissivity_bias_multiplier: 1.0,
    ir_aim: 'Lowest curve apex (= bottom center), ½″ away',
    heat_time: '30–45s',
    heat_seconds: [30, 45],
    cool_seconds: [30, 50],
    pattern: 'circular_sweep',
    zones: [{ anatomy: 'bottom curve', pct: 70 }, { anatomy: 'lower walls', pct: 30 }],
    torch_distance: '1–2″',
    visual_cue: 'Just before glow on the curve',
    cold_start: 'YES',
    tags: ['CLASSIC', 'COLD-START IDEAL'],
    mfrs: ['AFM Round Bottom', 'Bear Quartz Round V2', 'VapeBrat Full-Weld', 'Joel Halen'],
  },
  {
    id: 'core-reactor',
    name: 'Core Reactor',
    category: 'specialty',
    geometry: 'bucket',
    description: 'Central pillar increases surface area + thermal mass. Cold-start compatible per Honeybee Herb.',
    surface_range: [500, 580],
    gradient_lag_f: 30,
    emissivity_bias_multiplier: 1.0,
    ir_aim: 'Inner bucket floor around pillar, ½″ away',
    heat_time: '25–30s',
    heat_seconds: [25, 30],
    cool_seconds: [45, 60],
    pattern: 'circular_sweep_floor',
    zones: [{ anatomy: 'opaque bottom', pct: 70 }, { anatomy: 'lower outer wall', pct: 30 }],
    torch_distance: '1–2″',
    visual_cue: 'Heat shimmer, no orange glow',
    cold_start: 'YES',
    tags: ['HEAT MASS', 'COLD-START OK'],
    mfrs: ['VapeBrat Core Reactor', 'Yo Dabba Dabba', 'Honeybee Herb Core Reactor', 'Termini'],
  },
  {
    id: 'swing-arm',
    name: 'Swing-Arm Honey Bucket',
    category: 'specialty',
    geometry: 'bucket',
    description: 'Legacy form factor — heat dome out of chamber, swing back in. NOT cold-start compatible.',
    surface_range: [500, 600],
    gradient_lag_f: 28,
    emissivity_bias_multiplier: 1.0,
    ir_aim: 'Outside of dome in heating position, ~1″ away',
    heat_time: '15–30s',
    heat_seconds: [15, 30],
    cool_seconds: [10, 30],
    pattern: 'circular_sweep',
    zones: [{ anatomy: 'swung-out dish bottom', pct: 100 }],
    torch_distance: '1″',
    visual_cue: 'Slight shimmer, no red',
    cold_start: 'NO',
    tags: ['LEGACY', 'NO COLD-START'],
    mfrs: ['Mothership (vintage)', 'Honeybee Herb OFZ'],
  },
  {
    id: 'terp-slurper',
    name: 'Terp Slurper',
    category: 'slurper',
    geometry: 'slurper',
    description: 'Bottom dish + slotted column + bucket. Marble cap. Hot-start required — vortex needs preheat.',
    surface_range: [420, 580],
    gradient_lag_f: 15,
    emissivity_bias_multiplier: 1.0,
    ir_aim: 'Side of cup ½″ above the dish (column, NOT dish underside) — Dab Rite 2025 spec',
    heat_time: '55–90s',
    heat_seconds: [55, 90],
    cool_seconds: [35, 60],
    pattern: 'sequenced',
    zones: [
      { anatomy: 'bottom dish', pct: 50 },
      { anatomy: 'slotted column', pct: 31 },
      { anatomy: 'dish return', pct: 19 },
    ],
    torch_distance: '½–1″',
    visual_cue: 'Faint dish glow only',
    cold_start: 'NO',
    tags: ['SLURPER-CLASS', 'NO COLD-START'],
    mfrs: ['Toro (originator)', 'Highly Educated', 'Evan Shore', 'MJ Arsenal', 'Bear Quartz', 'Campfire Quartz'],
  },
  {
    id: 'blender',
    name: 'Blender / Vector',
    category: 'slurper',
    geometry: 'slurper',
    description: 'Slotted hurricane disc spins pearls automatically. Tighter temp window than slurper.',
    surface_range: [500, 580],
    gradient_lag_f: 15,
    emissivity_bias_multiplier: 1.0,
    ir_aim: 'Side of the tower at mid-height (slurper-class — NOT disc underside)',
    heat_time: '25–35s',
    heat_seconds: [25, 35],
    cool_seconds: [30, 45],
    pattern: 'circular_sweep',
    zones: [{ anatomy: 'under slotted disc', pct: 60 }, { anatomy: 'lower wall above slits', pct: 40 }],
    torch_distance: '½–1″',
    visual_cue: 'Faint red bottom corner',
    cold_start: 'OPTIONAL',
    tags: ['SLURPER-CLASS', 'AUTO-SPIN'],
    mfrs: ['Bear Quartz V2 Blender', 'Pulsar Quartz Blender', 'Campfire V2', 'VapeBrat Swirl'],
  },
  {
    id: 'spinner',
    name: 'Spinner / Tourbillon',
    category: 'slurper',
    geometry: 'slurper',
    description: 'Angled airflow holes drive pearl spin via inhale velocity. Pearl spin is airflow-driven, not temperature-driven.',
    surface_range: [500, 600],
    gradient_lag_f: 15,
    emissivity_bias_multiplier: 1.0,
    ir_aim: 'Side of bucket wall mid-height (avoid drilled holes — radial crack risk)',
    heat_time: '25–40s',
    heat_seconds: [25, 40],
    cool_seconds: [45, 60],
    pattern: 'circular_sweep',
    zones: [{ anatomy: 'bucket bottom', pct: 65 }, { anatomy: 'wall between holes', pct: 35 }],
    torch_distance: '½–1″',
    visual_cue: 'Faint glow on the bottom',
    cold_start: 'OPTIONAL',
    tags: ['SLURPER-CLASS', 'AUTO-SPIN'],
    mfrs: ['Yo Dabba Dabba', 'VapeBrat Cyclone', 'aLeaf', 'IC Glass'],
  },
  {
    id: 'control-tower',
    name: 'Control Tower (HE)',
    category: 'slurper',
    geometry: 'slurper',
    description: 'Highly Educated proprietary slurper with SE Pillar (Surface Enhanced micro-textured quartz).',
    surface_range: [450, 580],
    gradient_lag_f: 15,
    emissivity_bias_multiplier: 1.0,
    ir_aim: 'Side of the chamber, NOT the dish (Highly Educated FAQ)',
    heat_time: '50–60s',
    heat_seconds: [50, 60],
    cool_seconds: [30, 45],
    pattern: 'simultaneous_sweep',
    zones: [{ anatomy: 'dish + chamber simultaneously', pct: 100 }],
    torch_distance: '½–1″',
    visual_cue: 'Pillar visibly at temp, faint glow in dim room',
    cold_start: 'NO',
    tags: ['MFR SPEC', 'SE PILLAR'],
    mfr_targets: { solventless: 450, hydrocarbon: 550 },
    mfrs: ['Highly Educated'],
  },
  {
    id: 'charmer',
    name: 'Quave Charmer',
    category: 'slurper',
    geometry: 'slurper',
    description: 'Quave proprietary slurper-blender hybrid. Outer dish with vortex holes, inner cone, three pearls, marble cap.',
    surface_range: [450, 580],
    gradient_lag_f: 15,
    emissivity_bias_multiplier: 1.0,
    ir_aim: 'Side of the cup wall (slurper-class — inferred)',
    heat_time: '35–50s',
    heat_seconds: [35, 50],
    cool_seconds: [30, 45],
    pattern: 'circular_sweep',
    zones: [{ anatomy: 'bottom skirt with vortex holes', pct: 60 }, { anatomy: 'bucket walls', pct: 40 }],
    torch_distance: '½–1″',
    visual_cue: 'No glow / faint dish only',
    cold_start: 'NO',
    tags: ['SLURPER-CLASS'],
    mfrs: ['Quave Club Banger'],
  },
  {
    id: 'insert',
    name: 'Quartz Insert (drop-in)',
    category: 'specialty',
    geometry: 'insert',
    description: 'Drop-in cup. Either heat host first then drop insert, or load insert cold and heat host briefly.',
    surface_range: [450, 550],
    gradient_lag_f: 30,
    emissivity_bias_multiplier: 1.0,
    ir_aim: 'Host banger bottom, ½″ away (read banger temp, not insert directly)',
    heat_time: '25–35s host (or 10–25 cold-start)',
    heat_seconds: [25, 35],
    cool_seconds: [10, 30],
    pattern: 'circular_sweep',
    zones: [{ anatomy: 'host banger bottom', pct: 60 }, { anatomy: 'host walls', pct: 40 }],
    torch_distance: '1–2″ host; never insert directly',
    visual_cue: 'Per host banger',
    cold_start: 'YES',
    tags: ['COLD-START IDEAL'],
    mfrs: ['Eternal Quartz (originator)', 'Quartz Tech', 'Halen', 'Hoyes', 'Ruby Pearl Co', 'Pulsar RoK'],
  },
  {
    id: 'e-banger',
    name: 'E-Banger / E-Nail',
    category: 'specialty',
    geometry: 'enail',
    description: 'Coil-wrapped quartz with PID. Coil reads 30–80°F hotter than surface (varies widely by brand). MiniNail-on-MiniNail is factory-calibrated to display surface directly.',
    surface_range: [500, 600],
    gradient_lag_f: 0,
    emissivity_bias_multiplier: 0,
    ir_aim: 'PID set point — no IR / no torch needed',
    heat_time: '30s stabilize',
    heat_seconds: [30, 30],
    cool_seconds: [0, 0],
    pattern: 'circular_sweep',
    zones: [{ anatomy: 'PID maintained', pct: 100 }],
    torch_distance: 'n/a',
    visual_cue: 'Coil at set temp',
    cold_start: 'YES',
    tags: ['ELECTRIC', 'NO_TORCH'],
    mfrs: ['MiniNail', 'VapeBrat', 'Pulsar Elite', 'Yo Dabba Dabba', 'Galaxy Enails'],
  },
];

// ─── Concentrates (38 entries incl. 4 blocked) ──────────────────────────────

export const CONCENTRATES: Concentrate[] = [
  // Solventless (9)
  {
    id: 'live-rosin',
    name: 'Live Rosin',
    cat: 'Solventless',
    description: 'Fresh-frozen pressed solventless. Glossy amber, sappy.',
    surface_range: [445, 520],
    surface_optimal: 480,
    fluid_target_optimal: 415,
    fluid_target_range: [380, 455],
    terps: 'high',
    cold_start_good: true,
    notes: ['Cold start GOLD STANDARD', '710 Labs anchor: 400–450°F surface', 'Above 520°F = generic dab taste'],
    confidence: 'BRAND+COMMUNITY',
    tags: ['SOLVENTLESS', 'COLD-START'],
  },
  {
    id: 'cold-cure',
    name: 'Cold Cure Rosin',
    cat: 'Solventless',
    description: 'Live rosin nucleated to creamy badder. Most popular 2026 rosin format.',
    surface_range: [375, 510],
    surface_optimal: 460,
    fluid_target_optimal: 395,
    fluid_target_range: [310, 445],
    terps: 'high',
    cold_start_good: true,
    notes: ['Cold start STRONGLY recommended', 'Mood/Puffco anchor: 375–450°F surface', 'Pushing past 500°F defeats the cure'],
    confidence: 'BRAND+MFR',
    tags: ['SOLVENTLESS', 'COLD-START', '2026 DOMINANT'],
  },
  {
    id: 'fresh-press',
    name: 'Fresh Press Rosin',
    cat: 'Solventless',
    description: 'Un-cured rosin. Most volatile-rich, terps not yet homogenized.',
    surface_range: [440, 510],
    surface_optimal: 470,
    fluid_target_optimal: 405,
    fluid_target_range: [375, 445],
    terps: 'high',
    cold_start_good: true,
    notes: ['Cold start strongly recommended', 'Gentle ramp protects pinene + ocimene'],
    confidence: 'BRAND+COMMUNITY',
    tags: ['SOLVENTLESS', 'COLD-START'],
  },
  {
    id: 'rosin-jam',
    name: 'Rosin Jam',
    cat: 'Solventless',
    description: 'THCa diamonds in terpene-rich rosin sauce. Heterogeneous.',
    surface_range: [490, 545],
    surface_optimal: 510,
    fluid_target_optimal: 445,
    fluid_target_range: [425, 480],
    terps: 'high',
    cold_start_good: true,
    notes: ['Slurper preferred — separates phases dynamically', 'Crystals need ≥480°F to melt cleanly'],
    confidence: 'COMMUNITY+BRAND',
    tags: ['SOLVENTLESS', 'BLEND'],
  },
  {
    id: 'rosin-badder',
    name: 'Rosin Badder',
    cat: 'Solventless',
    description: 'Whipped/agitated rosin. Hashwriter avg 520°F Terpometer interior.',
    surface_range: [480, 540],
    surface_optimal: 510,
    fluid_target_optimal: 445,
    fluid_target_range: [415, 475],
    terps: 'high',
    cold_start_good: false,
    notes: ['Cold start optional'],
    confidence: 'COMMUNITY',
    tags: ['SOLVENTLESS'],
  },
  {
    id: 'hot-cure',
    name: 'Hot Cure Rosin',
    cat: 'Solventless',
    description: 'Whipped/cured at 90–225°F. Profile shifts to heavier sesquiterpenes.',
    surface_range: [480, 545],
    surface_optimal: 510,
    fluid_target_optimal: 445,
    fluid_target_range: [415, 480],
    terps: 'med',
    cold_start_good: false,
    notes: ['Cold start optional', 'Caryophyllene dominant — needs more heat than fresh'],
    confidence: 'BRAND+COMMUNITY',
    tags: ['SOLVENTLESS'],
  },
  {
    id: 'hash-rosin-coin',
    name: 'Hash Rosin Coin',
    cat: 'Solventless',
    description: 'Pressed disk from 5–6 star bubble. Premium fresh-frozen input.',
    surface_range: [450, 520],
    surface_optimal: 475,
    fluid_target_optimal: 410,
    fluid_target_range: [385, 455],
    terps: 'high',
    cold_start_good: true,
    notes: ['Cold start YES', 'Flatten coin into hash flag for even melt'],
    confidence: 'BRAND+COMMUNITY',
    tags: ['SOLVENTLESS', 'COLD-START'],
  },
  {
    id: 'persy-rosin',
    name: 'Persy Hash Rosin',
    cat: 'Solventless',
    description: '710 Labs originated. 6-star 90-micron first-wash bubble pressed to rosin.',
    surface_range: [445, 520],
    surface_optimal: 480,
    fluid_target_optimal: 415,
    fluid_target_range: [380, 455],
    terps: 'high',
    cold_start_good: true,
    notes: ['Treat like live rosin', 'Genericized term in 2026'],
    confidence: 'BRAND',
    tags: ['SOLVENTLESS', 'PREMIUM'],
  },
  {
    id: 'high-melt-rosin',
    name: 'High-Melt / Nug-Run Rosin',
    cat: 'Solventless',
    description: 'Premium hash rosin from highest-grade nugs. Connoisseur tier 2025–26.',
    surface_range: [445, 510],
    surface_optimal: 475,
    fluid_target_optimal: 410,
    fluid_target_range: [380, 445],
    terps: 'high',
    cold_start_good: true,
    notes: ["Treat like live rosin", "710 Labs Tier 3, Papa's Select top tier"],
    confidence: 'BRAND',
    tags: ['SOLVENTLESS', 'PREMIUM'],
  },

  // Hash (5)
  {
    id: 'bubble-6star',
    name: 'Bubble · 6-Star (Full Melt)',
    cat: 'Hash',
    description: 'Ice water hash, full-melt grade. Hashwriter avg 477.5°F Terpometer interior.',
    surface_range: [450, 510],
    surface_optimal: 490,
    fluid_target_optimal: 425,
    fluid_target_range: [385, 445],
    terps: 'high',
    cold_start_good: true,
    notes: ['Cold start YES', 'Above 500°F starts charring even 6-star'],
    confidence: 'BRAND+COMMUNITY',
    tags: ['HASH', 'COLD-START'],
  },
  {
    id: 'bubble-half-melt',
    name: 'Bubble · 3–4 Star (Half Melt)',
    cat: 'Hash',
    description: "Half-melt bubble. Field consensus: don't dab — press to rosin.",
    surface_range: [470, 520],
    surface_optimal: 495,
    fluid_target_optimal: 430,
    fluid_target_range: [405, 455],
    terps: 'med',
    cold_start_good: false,
    warning: 'Better pressed than dabbed.',
    notes: ['NOT IDEAL for dabbing', 'Better used as rosin starter material'],
    confidence: 'COMMUNITY',
    tags: ['HASH', 'NOT IDEAL'],
  },
  {
    id: 'dry-sift',
    name: 'Dry Sift (Full Melt)',
    cat: 'Hash',
    description: 'Mechanically separated trichomes via 45–160µm screens.',
    surface_range: [450, 520],
    surface_optimal: 490,
    fluid_target_optimal: 425,
    fluid_target_range: [385, 455],
    terps: 'high',
    cold_start_good: true,
    notes: ['Cold start YES', 'Treat like ice water hash'],
    confidence: 'BRAND+COMMUNITY',
    tags: ['HASH', 'COLD-START'],
  },
  {
    id: 'temple-ball',
    name: 'Temple Ball',
    cat: 'Hash',
    description: 'Hand-rolled spherical hash, Nepalese-style. Frenchy Cannoli legacy.',
    surface_range: [350, 450],
    surface_optimal: 400,
    fluid_target_optimal: 335,
    fluid_target_range: [285, 385],
    terps: 'high',
    cold_start_good: true,
    notes: ['Press Club: 350°F surface (NOT same as rosin 450°F)', 'Often a smoke-first product', 'Cold start strongly recommended'],
    confidence: 'BRAND',
    tags: ['HASH', 'LOW TEMP'],
  },
  {
    id: 'pressed-hash',
    name: 'Pressed Hashish',
    cat: 'Hash',
    description: 'Traditional Moroccan/Afghan/Charas. Will char on most bangers.',
    surface_range: [500, 550],
    surface_optimal: 525,
    fluid_target_optimal: 460,
    fluid_target_range: [435, 485],
    terps: 'low',
    cold_start_good: false,
    warning: 'Will leave significant residue. Better in pipe or hot knife.',
    notes: ['NOT OPTIMAL for dabbing — expect residue'],
    confidence: 'BRAND',
    tags: ['HASH', 'NOT IDEAL'],
  },

  // Hydrocarbon (13)
  {
    id: 'live-resin',
    name: 'Live Resin',
    cat: 'Hydrocarbon',
    description: 'Fresh-frozen hydrocarbon BHO. ~34% of concentrate sales.',
    surface_range: [480, 545],
    surface_optimal: 510,
    fluid_target_optimal: 445,
    fluid_target_range: [415, 480],
    terps: 'high',
    cold_start_good: false,
    notes: ['Cold start optional', 'Stay ≤545°F surface to preserve linalool + humulene', 'Most popular hydrocarbon format'],
    confidence: 'MFR+BRAND+COMMUNITY',
    tags: ['HYDROCARBON', 'POPULAR'],
  },
  {
    id: 'cured-resin',
    name: 'Cured Resin',
    cat: 'Hydrocarbon',
    description: 'BHO from cured flower. Sesquiterpene-heavy.',
    surface_range: [520, 580],
    surface_optimal: 545,
    fluid_target_optimal: 480,
    fluid_target_range: [455, 515],
    terps: 'low',
    cold_start_good: false,
    notes: ['Cold start NOT typical', 'Sesquiterpene-heavy — takes more heat'],
    confidence: 'BRAND+COMMUNITY',
    tags: ['HYDROCARBON'],
  },
  {
    id: 'shatter',
    name: 'Shatter',
    cat: 'Hydrocarbon',
    description: 'Glassy BHO. Once dominant, now legacy/budget tier.',
    surface_range: [510, 580],
    surface_optimal: 545,
    fluid_target_optimal: 480,
    fluid_target_range: [445, 515],
    terps: 'low',
    cold_start_good: false,
    notes: ['Cold start NOT typical', 'Most volatile terps already lost in process'],
    confidence: 'COMMUNITY',
    tags: ['HYDROCARBON', 'LEGACY'],
  },
  {
    id: 'wax-budder',
    name: 'Wax / Budder / Badder',
    cat: 'Hydrocarbon',
    description: 'Whipped BHO. Stable mid-tier across menus.',
    surface_range: [480, 540],
    surface_optimal: 510,
    fluid_target_optimal: 445,
    fluid_target_range: [415, 475],
    terps: 'med',
    cold_start_good: false,
    notes: ['Cold start optional/popular'],
    confidence: 'COMMUNITY',
    tags: ['HYDROCARBON'],
  },
  {
    id: 'crumble',
    name: 'Crumble / Honeycomb',
    cat: 'Hydrocarbon',
    description: 'Dry powdery BHO. Lower moisture vaporizes easily.',
    surface_range: [480, 550],
    surface_optimal: 510,
    fluid_target_optimal: 445,
    fluid_target_range: [415, 485],
    terps: 'med',
    cold_start_good: false,
    notes: ['Pearls essential to distribute', 'Cold start useful'],
    confidence: 'COMMUNITY',
    tags: ['HYDROCARBON'],
  },
  {
    id: 'sugar',
    name: 'Sugar Wax',
    cat: 'Hydrocarbon',
    description: 'Small THCa crystals in terpene matrix.',
    surface_range: [480, 545],
    surface_optimal: 510,
    fluid_target_optimal: 445,
    fluid_target_range: [415, 480],
    terps: 'high',
    cold_start_good: true,
    notes: ['Cold start LOVED for this texture'],
    confidence: 'COMMUNITY',
    tags: ['HYDROCARBON', 'COLD-START'],
  },
  {
    id: 'sauce-htfse',
    name: 'Sauce (HTFSE)',
    cat: 'Hydrocarbon',
    description: 'High-terpene full-spectrum extract. ~50% terpenes.',
    surface_range: [500, 580],
    surface_optimal: 530,
    fluid_target_optimal: 465,
    fluid_target_range: [435, 515],
    terps: 'high',
    cold_start_good: true,
    notes: ['Cold start recommended for HTFSE', 'Slurper geometry designed for this'],
    confidence: 'BRAND+COMMUNITY',
    tags: ['HYDROCARBON', 'COLD-START'],
  },
  {
    id: 'thca-diamonds',
    name: 'THCa Diamonds (alone)',
    cat: 'Hydrocarbon',
    description: 'Discrete crystalline gemstones, 95–99% THCa, near-zero terpenes.',
    surface_range: [500, 600],
    surface_optimal: 545,
    fluid_target_optimal: 480,
    fluid_target_range: [435, 535],
    terps: 'none',
    cold_start_good: false,
    notes: ['Pearls essential', 'Cold start useful', 'Sensor-driven temp choice'],
    confidence: 'MFR+BRAND',
    tags: ['HYDROCARBON', 'PURE'],
  },
  {
    id: 'diamonds-sauce',
    name: 'Diamonds & Sauce',
    cat: 'Hydrocarbon',
    description: 'Crystals in terpene-rich sauce.',
    surface_range: [510, 570],
    surface_optimal: 530,
    fluid_target_optimal: 465,
    fluid_target_range: [445, 505],
    terps: 'high',
    cold_start_good: true,
    notes: ['Slurper preferred', 'Cold start: sauce volatilizes first, then crystals'],
    confidence: 'MFR+BRAND',
    tags: ['HYDROCARBON', 'COLD-START', 'BLEND'],
  },
  {
    id: 'crystalline',
    name: 'THCa Crystalline / Isolate',
    cat: 'Hydrocarbon',
    description: 'Pure powder, >99% THCa. Zero terpenes.',
    surface_range: [525, 600],
    surface_optimal: 560,
    fluid_target_optimal: 495,
    fluid_target_range: [460, 535],
    terps: 'none',
    cold_start_good: false,
    notes: ['Use sticky binder (live resin) for cold start', 'Just needs full vaporization of THC'],
    confidence: 'COMMUNITY',
    tags: ['HYDROCARBON', 'PURE', 'NICHE'],
  },
  {
    id: 'liquid-diamonds',
    name: 'Liquid Diamonds (jar)',
    cat: 'Hydrocarbon',
    description: 'Live resin + THCa diamonds. If dabbing jar form: treat like diamonds & sauce.',
    surface_range: [500, 570],
    surface_optimal: 530,
    fluid_target_optimal: 465,
    fluid_target_range: [435, 505],
    terps: 'high',
    cold_start_good: false,
    notes: ['Mostly vaped not dabbed', 'If dabbing jar form: treat like diamonds & sauce'],
    confidence: 'BRAND',
    tags: ['HYDROCARBON', 'TRENDING'],
  },

  // Distillate (5)
  {
    id: 'co2-oil',
    name: 'CO₂ Oil',
    cat: 'Distillate',
    description: 'Supercritical CO₂ extraction. Most volatile terps lost in process.',
    surface_range: [520, 600],
    surface_optimal: 560,
    fluid_target_optimal: 495,
    fluid_target_range: [455, 535],
    terps: 'low',
    cold_start_good: false,
    notes: ['Cold start optional', 'Fading in dab market — common in carts'],
    confidence: 'BRAND',
    tags: ['DISTILLATE'],
  },
  {
    id: 'thc-distillate',
    name: 'THC Distillate',
    cat: 'Distillate',
    description: '~99% pure, viscous, terpene-stripped.',
    surface_range: [540, 620],
    surface_optimal: 580,
    fluid_target_optimal: 515,
    fluid_target_range: [475, 555],
    terps: 'none',
    cold_start_good: false,
    warning: 'No flavor — rarely dabbed alone.',
    notes: ['Cold start NOT recommended', 'Hemper 400–500°F (smooth) vs Zen Leaf 600–650°F (cloud)', 'Rarely dabbed alone'],
    confidence: 'BRAND',
    tags: ['DISTILLATE'],
  },
  {
    id: 'cbn-distillate',
    name: 'CBN Distillate',
    cat: 'Distillate',
    description: 'CBN-focused, often blended with sleep terpenes.',
    surface_range: [490, 570],
    surface_optimal: 525,
    fluid_target_optimal: 460,
    fluid_target_range: [425, 505],
    terps: 'low',
    cold_start_good: false,
    notes: ['CBN boiling: 365°F at 1 atm', 'Often blended for synergy'],
    confidence: 'SCIENCE+BRAND',
    tags: ['DISTILLATE', 'NICHE'],
  },
  {
    id: 'cbg-distillate',
    name: 'CBG Distillate',
    cat: 'Distillate',
    description: 'CBG-focused. Springer study: degradation begins ~608°F.',
    surface_range: [480, 560],
    surface_optimal: 520,
    fluid_target_optimal: 455,
    fluid_target_range: [415, 495],
    terps: 'low',
    cold_start_good: false,
    notes: ['CBG boiling: 126°F (very low) — needs gentle heat'],
    confidence: 'SCIENCE+BRAND',
    tags: ['DISTILLATE', 'NICHE'],
  },
  {
    id: 'thcv-distillate',
    name: 'THCV Distillate',
    cat: 'Distillate',
    description: 'THCV boiling 428°F (highest of common cannabinoids), but matrix needs more.',
    surface_range: [540, 610],
    surface_optimal: 570,
    fluid_target_optimal: 505,
    fluid_target_range: [475, 545],
    terps: 'low',
    cold_start_good: false,
    notes: ['Anecdotal practice — sparse data'],
    confidence: 'SCIENCE+ANECDOTAL',
    tags: ['DISTILLATE', 'NICHE', 'NOVEL'],
  },

  // Novel (2)
  {
    id: 'infused-diamonds',
    name: 'Infused Diamonds',
    cat: 'Novel',
    description: 'Strain-specific or terpene-infused diamonds.',
    surface_range: [510, 570],
    surface_optimal: 530,
    fluid_target_optimal: 465,
    fluid_target_range: [445, 505],
    terps: 'high',
    cold_start_good: true,
    notes: ['Cold start YES', 'Treat as diamonds & sauce'],
    confidence: 'BRAND',
    tags: ['NOVEL', 'COLD-START'],
  },
  {
    id: 'thcp',
    name: 'THCP Concentrates',
    cat: 'Novel',
    description: 'Hemp-derived. Very small % since extremely potent (~33× CB1 binding).',
    surface_range: [510, 580],
    surface_optimal: 540,
    fluid_target_optimal: 475,
    fluid_target_range: [445, 515],
    terps: 'low',
    cold_start_good: false,
    warning: 'Regulatory uncertainty — Nov 2026 federal hemp ban.',
    notes: ['REGULATORY FLAG: H.R. 5371 (Nov 2026)', 'State bans growing', 'Treat as distillate-style'],
    confidence: 'ANECDOTAL',
    tags: ['NOVEL', 'GRAY MARKET'],
  },

  // Blocked (4) — cannot be dabbed
  {
    id: 'hash-holes',
    name: 'Hash Holes / Donut Joints',
    cat: 'Novel',
    description: 'Pre-roll with central rosin/bubble hash worm.',
    surface_range: null,
    surface_optimal: null,
    fluid_target_optimal: null,
    fluid_target_range: null,
    terps: 'high',
    cold_start_good: false,
    blocked: "This is a pre-roll format. Light it and smoke it — don't put it on a banger.",
    confidence: 'N/A',
    tags: ['SMOKE ONLY'],
  },
  {
    id: 'kief',
    name: 'Kief / Static',
    cat: 'Hash',
    description: 'Loose unrefined trichome powder. Dust, low-melt.',
    surface_range: null,
    surface_optimal: null,
    fluid_target_optimal: null,
    fluid_target_range: null,
    terps: 'med',
    cold_start_good: false,
    blocked: 'Kief is too dusty for direct dabs and will combust unevenly. Press it to rosin first, or use as bowl topper.',
    confidence: 'N/A',
    tags: ['NOT FOR DAB'],
  },
  {
    id: 'rso',
    name: 'RSO / FECO',
    cat: 'Distillate',
    description: 'Rick Simpson Oil / Full Extract Cannabis Oil.',
    surface_range: null,
    surface_optimal: null,
    fluid_target_optimal: null,
    fluid_target_range: null,
    terps: 'low',
    cold_start_good: false,
    blocked: 'RSO is meant for oral or topical use. Dabbing is harsh due to chlorophyll, waxes, and residual solvents.',
    confidence: 'N/A',
    tags: ['ORAL/TOPICAL'],
  },
  {
    id: 'bubble-1-2',
    name: 'Bubble · 1–2 Star',
    cat: 'Hash',
    description: 'Cooking-grade ice water hash.',
    surface_range: null,
    surface_optimal: null,
    fluid_target_optimal: null,
    fluid_target_range: null,
    terps: 'low',
    cold_start_good: false,
    blocked: '1–2 star bubble has too much plant matter. Use it for edibles or press multiple grades together to rosin.',
    confidence: 'N/A',
    tags: ['NOT FOR DAB'],
  },
];

// ─── Sensors (1 entry) ───────────────────────────────────────────────────────

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

// ─── Wall thicknesses (4 entries) ───────────────────────────────────────────

export const WALLS: Wall[] = [
  {
    id: 'thin',
    name: 'Thin',
    thickness: '1.5–2.5 mm',
    mod: -8,
    gradient_multiplier: 0.5,
    description: 'Light flat tops. Faster heat, faster cool.',
  },
  {
    id: 'standard',
    name: 'Standard',
    thickness: '3–4 mm',
    mod: 0,
    gradient_multiplier: 1.0,
    description: 'Typical premium banger. Default.',
  },
  {
    id: 'thick',
    name: 'Thick',
    thickness: '5–6 mm',
    mod: 12,
    gradient_multiplier: 1.6,
    description: 'Heavy reactor / opaque. More retention.',
  },
  {
    id: 'unknown',
    name: "Don't know",
    thickness: '—',
    mod: 0,
    gradient_multiplier: 1.0,
    description: 'Defaults to standard.',
  },
];

// ─── Saved presets (8 built-in) ──────────────────────────────────────────────

export const SAVED_PRESETS: SavedPreset[] = [
  {
    id: 'quartz',
    name: 'Quartz Recommended',
    kind: 'quartz',
    banger: 'flat-top',
    concentrate: 'live-resin',
    sensor: 'ir',
    wall: 'standard',
    builtin: true,
    desc: 'Live resin · flat top · IR. Daily target.',
  },
  {
    id: 'opaque',
    name: 'Opaque Recommended',
    kind: 'opaque',
    banger: 'opaque-bottom',
    concentrate: 'live-resin',
    sensor: 'ir',
    wall: 'thick',
    builtin: true,
    desc: 'Best IR accuracy. Switch to Opaque Quartz preset on the IR.',
  },
  {
    id: 'rosin',
    name: '710 Labs Solventless',
    kind: 'low',
    banger: 'round-bottom',
    concentrate: 'live-rosin',
    sensor: 'ir',
    wall: 'standard',
    builtin: true,
    desc: '480°F surface anchor for fresh-press rosin.',
  },
  {
    id: 'cold-cure-low',
    name: 'Cold-Cure · Low & Slow',
    kind: 'low',
    banger: 'round-bottom',
    concentrate: 'cold-cure',
    sensor: 'ir',
    wall: 'standard',
    builtin: false,
    desc: 'Mood/Puffco anchor. 460°F surface, IR-aimed.',
  },
  {
    id: 'hash-coin',
    name: 'Hash Coin · Cold Start',
    kind: 'custom',
    banger: 'insert',
    concentrate: 'hash-rosin-coin',
    sensor: 'ir',
    wall: 'standard',
    builtin: false,
    desc: 'Insert workflow, cold-start ideal.',
  },
  {
    id: 'slurper-sauce',
    name: 'HTFSE · Terp Slurper',
    kind: 'custom',
    banger: 'terp-slurper',
    concentrate: 'sauce-htfse',
    sensor: 'ir',
    wall: 'standard',
    builtin: false,
    desc: 'Sequenced heat. Marble cap.',
  },
  {
    id: 'temple',
    name: 'Temple Ball · Sip',
    kind: 'low',
    banger: 'round-bottom',
    concentrate: 'temple-ball',
    sensor: 'ir',
    wall: 'thin',
    builtin: false,
    desc: 'Press Club 350°F surface — low-temp hash.',
  },
  {
    id: 'diamonds-hot',
    name: 'THCa Diamonds · Hot',
    kind: 'opaque',
    banger: 'opaque-bottom',
    concentrate: 'thca-diamonds',
    sensor: 'ir',
    wall: 'thick',
    builtin: false,
    desc: 'High-temp hydrocarbon, opaque IR-friendly.',
  },
];

// ─── Phase-change load constant ──────────────────────────────────────────────
// calibration.constants.phase_change_load_f from v2 schema. The °F drop the
// surface incurs as the dab makes contact and goes through phase change.
export const PHASE_CHANGE_LOAD_F = 65;

// ─── computeCalibration ──────────────────────────────────────────────────────
// v2 four-term metrology equation (IR sensor branch):
//   displayed = T_Ideal + dT_Load + dT_Gradient + dT_emissivity + wall.mod
//   T_Ideal       = concentrate.fluid_target_optimal
//   dT_Load       = PHASE_CHANGE_LOAD_F (65)
//   dT_Gradient   = banger.gradient_lag_f * wall.gradient_multiplier
//   dT_emissivity = sensor.emissivity_bias_f * banger.emissivity_bias_multiplier
//
// Anchor case: live-rosin (T_Ideal=415) + flat-top (lag=25, εmult=1.0) +
//   standard wall (mult=1.0, mod=0) + IR sensor (εbias=15)
//   ⇒ 415 + 65 + 25 + 15 + 0 = 520 °F (matches CHANGELOG validation matrix).
//
// MFR override applied first when banger.mfr_targets present — the override
// sets BOTH the surface temperature AND the T_Ideal we feed into the equation.

export function computeCalibration(
  b: Banger,
  c: Concentrate,
  w: Wall,
  s: Sensor = SENSORS[0],
): CalibResult {
  let surface = c.surface_optimal ?? 510;
  let tIdeal = c.fluid_target_optimal ?? (surface - PHASE_CHANGE_LOAD_F);
  let override: CalibResult['override'];

  if (b.mfr_targets) {
    const isSolventless = c.cat === 'Solventless' || c.cat === 'Hash';
    const mfrTarget = isSolventless ? b.mfr_targets.solventless : b.mfr_targets.hydrocarbon;
    if (mfrTarget != null) {
      surface = mfrTarget;
      tIdeal = surface - PHASE_CHANGE_LOAD_F;
      override = {
        source: b.name,
        surface,
        reason: `★ Override: ${b.name} spec for ${isSolventless ? 'solventless' : 'hydrocarbon'} = ${surface}°F`,
      };
    }
  }

  const wallMod = w.mod;
  let displayed: number;

  if (s.method === 'ir') {
    const dTLoad = PHASE_CHANGE_LOAD_F;
    const dTGradient = b.gradient_lag_f * w.gradient_multiplier;
    const dTEmiss = s.emissivity_bias_f * b.emissivity_bias_multiplier;
    displayed = tIdeal + dTLoad + dTGradient + dTEmiss + wallMod;
  } else {
    // Future-proofing: contact / visual / enail branches collapse to surface + wall.
    displayed = surface + wallMod;
  }

  const displayedRounded = Math.round(displayed);

  return {
    surface,
    ir: displayedRounded - surface - wallMod,
    wall: wallMod,
    displayed: displayedRounded,
    low: displayedRounded - 15,
    high: displayedRounded + 15,
    dunk: displayedRounded - 280,
    ...(override ? { override } : {}),
  };
}

// ─── coldStartFit ────────────────────────────────────────────────────────────
// PRD §5.3.4 decision matrix.

export function coldStartFit(
  c: Concentrate,
  b: Banger,
): 'IDEAL' | 'RECOMMENDED' | 'OPTIONAL' | 'NOT AVAILABLE' {
  if (b.cold_start === 'NO') return 'NOT AVAILABLE';
  if (c.cold_start_good && b.cold_start === 'YES') return 'IDEAL';
  if (c.cold_start_good && b.cold_start === 'OPTIONAL') return 'RECOMMENDED';
  return 'OPTIONAL';
}

// ─── computeOrbProps ─────────────────────────────────────────────────────────
// Returns visual orb state for each stage/phase of the dab session.

export function computeOrbProps(
  stage: OrbStage,
  phase: OrbPhase,
  sessionState: SessionState,
): OrbProps {
  const calib = sessionState.calibration;
  const currentTemp = sessionState.currentTemp ?? null;

  // Default fallback
  const defaults: OrbProps = {
    color: '#a78b7c',
    glowColor: 'rgba(167,139,124,0.3)',
    pulseScale: 1.0,
    label: '—',
    sublabel: '',
    showTemp: false,
  };

  if (stage === 'idle') {
    return {
      ...defaults,
      color: '#7a5c4b',
      glowColor: 'rgba(122,92,75,0.2)',
      pulseScale: 0.9,
      label: 'Ready',
      sublabel: 'Select your setup',
    };
  }

  if (stage === 'heat') {
    const tempLabel = currentTemp != null ? `${Math.round(currentTemp)}°` : '—';
    return {
      color: '#ff7a00',
      glowColor: 'rgba(255,122,0,0.5)',
      pulseScale: phase === 'active' ? 1.15 : 1.0,
      label: 'Heating',
      sublabel: tempLabel,
      showTemp: true,
    };
  }

  if (stage === 'cool') {
    const target = calib?.displayed ?? null;
    const tempLabel = currentTemp != null ? `${Math.round(currentTemp)}°` : '—';
    const atTemp = target != null && currentTemp != null && currentTemp <= target + 15;
    return {
      color: atTemp ? '#7EC8A0' : '#ffb68b',
      glowColor: atTemp ? 'rgba(126,200,160,0.45)' : 'rgba(255,182,139,0.4)',
      pulseScale: atTemp ? 1.1 : 1.0,
      label: atTemp ? 'At Temp' : 'Cooling',
      sublabel: tempLabel,
      showTemp: true,
    };
  }

  if (stage === 'ready') {
    return {
      color: '#7EC8A0',
      glowColor: 'rgba(126,200,160,0.6)',
      pulseScale: 1.12,
      label: 'Dab!',
      sublabel: calib ? `${calib.low}–${calib.high}°` : '',
      showTemp: false,
    };
  }

  if (stage === 'dab') {
    const tempLabel = currentTemp != null ? `${Math.round(currentTemp)}°` : '—';
    return {
      color: '#95ccff',
      glowColor: 'rgba(149,204,255,0.5)',
      pulseScale: phase === 'active' ? 1.08 : 1.0,
      label: 'Dabbing',
      sublabel: tempLabel,
      showTemp: true,
    };
  }

  if (stage === 'done') {
    return {
      color: '#7a5c4b',
      glowColor: 'rgba(122,92,75,0.2)',
      pulseScale: 0.95,
      label: 'Done',
      sublabel: 'Nice one',
      showTemp: false,
    };
  }

  return defaults;
}
