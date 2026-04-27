/**
 * Quartz banger form factors in active 2025-2026 production.
 *
 * Source: docs/ref/perfect_dab/bangers.json
 *
 * Every field in the source JSON is preserved here. The `geometry` field is
 * the discriminator for IR offset math (bucket-class subtracts, slurper-class
 * adds, insert reads host, e-nail does not use IR).
 */

export type BangerCategory = 'classic' | 'slurper' | 'specialty' | 'premium';
export type BangerGeometry = 'bucket' | 'slurper' | 'insert' | 'enail';
export type IrOffsetSign = -1 | 0 | 1;
export type ColdStartCompatibility = 'YES' | 'NO' | 'OPTIONAL';
export type TorchPattern =
  | 'circular_sweep'
  | 'circular_sweep_outer_only'
  | 'circular_sweep_floor'
  | 'sequenced'
  | 'simultaneous_sweep'
  | 'none';

export interface TorchZone {
  readonly anatomy: string;
  readonly time_pct: number;
}

export interface HeatTimeStage {
  readonly stage: string;
  readonly duration_seconds: number;
}

interface BangerBase {
  readonly id: string;
  readonly name: string;
  readonly category: BangerCategory;
  readonly description: string;
  readonly surface_temp_range_f: readonly [number, number];
  readonly ir_offset_f: number;
  readonly ir_offset_sign: IrOffsetSign;
  readonly ir_aim_location: string;
  readonly heat_time_seconds: string;
  readonly heat_time_breakdown?: readonly HeatTimeStage[];
  readonly heat_method?: string;
  readonly cooldown_seconds: string;
  readonly torch_pattern: TorchPattern;
  readonly torch_zones: readonly TorchZone[];
  readonly torch_distance_inches: string | null;
  readonly visual_cue: string;
  readonly cold_start_compatible: ColdStartCompatibility;
  readonly tags: readonly string[];
  readonly notable_manufacturers: readonly string[];
  readonly manufacturer_targets_f?: { readonly [profile: string]: number };
}

export interface BucketBanger extends BangerBase {
  readonly geometry: 'bucket';
}

export interface SlurperBanger extends BangerBase {
  readonly geometry: 'slurper';
}

export interface InsertBanger extends BangerBase {
  readonly geometry: 'insert';
}

export interface EnailBanger extends BangerBase {
  readonly geometry: 'enail';
  readonly pid_offset_range_f: readonly [number, number];
  readonly pid_offset_midpoint_f: number;
}

export type Banger = BucketBanger | SlurperBanger | InsertBanger | EnailBanger;
export type BangerId = Banger['id'];

export const BANGERS: readonly Banger[] = [
  {
    id: 'flat-top',
    name: 'Flat Top',
    category: 'classic',
    geometry: 'bucket',
    description: 'Universal default. Cylindrical bucket, flat rim. ~80% of bangers in market.',
    surface_temp_range_f: [500, 600],
    ir_offset_f: 35,
    ir_offset_sign: -1,
    ir_aim_location: 'Center underside of bucket bottom, 1/2" away',
    heat_time_seconds: '20-40',
    cooldown_seconds: '30-45',
    torch_pattern: 'circular_sweep',
    torch_zones: [
      { anatomy: 'bucket_bottom', time_pct: 60 },
      { anatomy: 'lower_walls', time_pct: 40 },
    ],
    torch_distance_inches: '1-2',
    visual_cue: 'Just shy of orange glow',
    cold_start_compatible: 'OPTIONAL',
    tags: ['CLASSIC'],
    notable_manufacturers: [
      'Quave',
      'Toro',
      'Highly Educated',
      'Evan Shore',
      'Honeybee Herb',
      'Pulsar',
      'MJ Arsenal',
    ],
  },
  {
    id: 'beveled',
    name: 'Beveled Edge',
    category: 'classic',
    geometry: 'bucket',
    description:
      'Inward-cut bevel for flush bubble cap seal. Better seal lets you target 20-40°F lower than non-beveled flat top.',
    surface_temp_range_f: [480, 580],
    ir_offset_f: 35,
    ir_offset_sign: -1,
    ir_aim_location: 'Center underside of bucket bottom, 1/2" away',
    heat_time_seconds: '25-35',
    cooldown_seconds: '35-50',
    torch_pattern: 'circular_sweep',
    torch_zones: [
      { anatomy: 'bucket_bottom', time_pct: 60 },
      { anatomy: 'lower_walls', time_pct: 40 },
    ],
    torch_distance_inches: '1-2',
    visual_cue: 'Just barely glowing',
    cold_start_compatible: 'OPTIONAL',
    tags: ['CLASSIC', 'BETTER_SEAL'],
    notable_manufacturers: [
      'Quave',
      'Highly Educated Gavel',
      'Evan Shore',
      'Pulsar Beveled Edge',
      'Honeybee Herb Original Bevel',
    ],
  },
  {
    id: 'opaque-bottom',
    name: 'Opaque Bottom',
    category: 'premium',
    geometry: 'bucket',
    description:
      'Sandblasted/frosted bottom disc. Best IR accuracy of any banger. Use Dab Rite "Opaque Quartz" emissivity preset.',
    surface_temp_range_f: [480, 560],
    ir_offset_f: 25,
    ir_offset_sign: -1,
    ir_aim_location:
      'Center of opaque bottom underside, 1/2" away (Dab Rite: switch to Opaque Quartz preset)',
    heat_time_seconds: '30-40',
    cooldown_seconds: '45-60',
    torch_pattern: 'circular_sweep',
    torch_zones: [
      { anatomy: 'opaque_bottom', time_pct: 70 },
      { anatomy: 'lower_walls', time_pct: 30 },
    ],
    torch_distance_inches: '1-2',
    visual_cue: 'Faint side-wall glow only — opaque hides bottom glow',
    cold_start_compatible: 'OPTIONAL',
    tags: ['BEST_IR_ACCURACY'],
    notable_manufacturers: [
      'Evan Shore Opaque ESB',
      'Highly Educated Gavel V3',
      'Lavatech XL Opaque',
      'Honeybee Herb Honey & Milk',
    ],
  },
  {
    id: 'thermal',
    name: 'Thermal (Double Wall)',
    category: 'specialty',
    geometry: 'bucket',
    description:
      'Air gap between walls insulates inner cup. IR reads cooler than actual oil contact temp because IR sees outer wall — compensate via timing.',
    surface_temp_range_f: [500, 600],
    ir_offset_f: 60,
    ir_offset_sign: -1,
    ir_aim_location: 'Outer base of bucket, 1/2" away (manufacturer-correct aim)',
    heat_time_seconds: '30-45',
    cooldown_seconds: '45-60',
    torch_pattern: 'circular_sweep_outer_only',
    torch_zones: [
      { anatomy: 'outer_side_wall', time_pct: 70 },
      { anatomy: 'outer_bottom', time_pct: 30 },
    ],
    torch_distance_inches: '0.5-1',
    visual_cue: 'No glow / faint outer corner glow only',
    cold_start_compatible: 'YES',
    tags: ['IR_READS_LOW'],
    notable_manufacturers: [
      'AFM Thermal',
      'Pukinbeagle',
      'Pulsar Thermal',
      'Honeybee Herb',
      'Ooze Quartz Thermal',
    ],
  },
  {
    id: 'round-bottom',
    name: 'Round Bottom',
    category: 'classic',
    geometry: 'bucket',
    description:
      'Hemispherical interior, no corners. Best shape for terp pearls (rolls freely) and cold start (oil pools center).',
    surface_temp_range_f: [500, 600],
    ir_offset_f: 35,
    ir_offset_sign: -1,
    ir_aim_location: 'Lowest curve apex (= bottom center), 1/2" away',
    heat_time_seconds: '30-45',
    cooldown_seconds: '30-50',
    torch_pattern: 'circular_sweep',
    torch_zones: [
      { anatomy: 'bottom_curve', time_pct: 70 },
      { anatomy: 'lower_walls', time_pct: 30 },
    ],
    torch_distance_inches: '1-2',
    visual_cue: 'Just before glow on the curve',
    cold_start_compatible: 'YES',
    tags: ['CLASSIC', 'COLD_START_IDEAL'],
    notable_manufacturers: [
      'AFM Round Bottom',
      'Bear Quartz Round V2',
      'VapeBrat Full-Weld',
      'Joel Halen artisan',
    ],
  },
  {
    id: 'core-reactor',
    name: 'Core Reactor',
    category: 'specialty',
    geometry: 'bucket',
    description:
      'Central pillar increases surface area + thermal mass. Cold-start compatible per Honeybee Herb.',
    surface_temp_range_f: [500, 580],
    ir_offset_f: 45,
    ir_offset_sign: -1,
    ir_aim_location: 'Inner bucket floor around pillar, 1/2" away',
    heat_time_seconds: '25-30',
    cooldown_seconds: '45-60',
    torch_pattern: 'circular_sweep_floor',
    torch_zones: [
      { anatomy: 'opaque_bottom', time_pct: 70 },
      { anatomy: 'lower_outer_wall', time_pct: 30 },
    ],
    torch_distance_inches: '1-2',
    visual_cue: 'Heat shimmer, no orange glow',
    cold_start_compatible: 'YES',
    tags: ['HEAT_MASS', 'COLD_START_OK'],
    notable_manufacturers: [
      'VapeBrat Core Reactor',
      'Yo Dabba Dabba',
      'Honeybee Herb Honey & Milk Core Reactor',
      'Termini',
    ],
  },
  {
    id: 'swing-arm',
    name: 'Swing-Arm Honey Bucket',
    category: 'specialty',
    geometry: 'bucket',
    description:
      'Legacy form factor — heat dome out of chamber, swing back in. NOT cold-start compatible.',
    surface_temp_range_f: [500, 600],
    ir_offset_f: 40,
    ir_offset_sign: -1,
    ir_aim_location: 'Outside of dome in heating position, ~1" away',
    heat_time_seconds: '15-30',
    cooldown_seconds: '10-30',
    torch_pattern: 'circular_sweep',
    torch_zones: [{ anatomy: 'swung_out_dish_bottom', time_pct: 100 }],
    torch_distance_inches: '1',
    visual_cue: 'Slight shimmer, no red',
    cold_start_compatible: 'NO',
    tags: ['LEGACY', 'NO_COLD_START'],
    notable_manufacturers: ['Mothership (vintage)', 'Honeybee Herb OFZ'],
  },
  {
    id: 'terp-slurper',
    name: 'Terp Slurper',
    category: 'slurper',
    geometry: 'slurper',
    description:
      'Bottom dish + slotted column + bucket. Marble cap. Hot-start required — vortex needs preheat.',
    surface_temp_range_f: [420, 580],
    ir_offset_f: 20,
    ir_offset_sign: 1,
    ir_aim_location:
      'Side of cup ~1/2" above the dish (column, NOT dish underside) — Dab Rite 2025 spec',
    heat_time_seconds: '55-90',
    heat_time_breakdown: [
      { stage: 'dish', duration_seconds: 40 },
      { stage: 'column', duration_seconds: 25 },
      { stage: 'dish_return', duration_seconds: 15 },
    ],
    cooldown_seconds: '35-60',
    torch_pattern: 'sequenced',
    torch_zones: [
      { anatomy: 'bottom_dish', time_pct: 50 },
      { anatomy: 'slotted_column', time_pct: 31 },
      { anatomy: 'dish_return', time_pct: 19 },
    ],
    torch_distance_inches: '0.5-1',
    visual_cue: 'Faint dish glow only',
    cold_start_compatible: 'NO',
    tags: ['SLURPER_CLASS', 'NO_COLD_START'],
    notable_manufacturers: [
      'Toro (originator)',
      'Highly Educated',
      'Evan Shore',
      'MJ Arsenal',
      'Pulsar Bubble Barrel',
      'Bear Quartz',
      'Campfire Quartz',
    ],
  },
  {
    id: 'blender',
    name: 'Blender / Vector',
    category: 'slurper',
    geometry: 'slurper',
    description: 'Slotted hurricane disc spins pearls automatically. Tighter temp window than slurper.',
    surface_temp_range_f: [500, 580],
    ir_offset_f: 20,
    ir_offset_sign: 1,
    ir_aim_location: 'Side of the tower at mid-height (slurper-class aim — NOT disc underside)',
    heat_time_seconds: '25-35',
    cooldown_seconds: '30-45',
    torch_pattern: 'circular_sweep',
    torch_zones: [
      { anatomy: 'under_slotted_disc', time_pct: 60 },
      { anatomy: 'lower_wall_above_slits', time_pct: 40 },
    ],
    torch_distance_inches: '0.5-1',
    visual_cue: 'Faint red bottom corner',
    cold_start_compatible: 'OPTIONAL',
    tags: ['SLURPER_CLASS', 'AUTO_SPIN'],
    notable_manufacturers: [
      'Bear Quartz V2 Blender',
      'Pulsar Quartz Blender',
      'Campfire V2 Blender',
      'VapeBrat Swirl',
    ],
  },
  {
    id: 'spinner',
    name: 'Spinner / Tourbillon',
    category: 'slurper',
    geometry: 'slurper',
    description:
      'Angled airflow holes drive pearl spin via inhale velocity. Pearl spin is airflow-driven, not temperature-driven.',
    surface_temp_range_f: [500, 600],
    ir_offset_f: 20,
    ir_offset_sign: 1,
    ir_aim_location: 'Side of bucket wall mid-height (avoid drilled holes — radial crack risk)',
    heat_time_seconds: '25-40',
    cooldown_seconds: '45-60',
    torch_pattern: 'circular_sweep',
    torch_zones: [
      { anatomy: 'bucket_bottom', time_pct: 65 },
      { anatomy: 'wall_between_holes', time_pct: 35 },
    ],
    torch_distance_inches: '0.5-1',
    visual_cue: 'Faint glow on the bottom',
    cold_start_compatible: 'OPTIONAL',
    tags: ['SLURPER_CLASS', 'AUTO_SPIN'],
    notable_manufacturers: [
      'Yo Dabba Dabba Auto-Spinner',
      'VapeBrat Cyclone',
      'aLeaf Deep Dish Auto-Spin',
      'IC Glass',
    ],
  },
  {
    id: 'control-tower',
    name: 'Control Tower',
    category: 'slurper',
    geometry: 'slurper',
    description:
      'Highly Educated proprietary slurper with SE Pillar (Surface Enhanced micro-textured quartz). Manufacturer targets: 450°F solventless / 550°F hydrocarbon (interior surface).',
    surface_temp_range_f: [450, 580],
    ir_offset_f: 20,
    ir_offset_sign: 1,
    ir_aim_location: 'Side of the chamber, NOT the dish (Highly Educated FAQ)',
    heat_time_seconds: '50-60',
    heat_method:
      'simultaneous (heat dish + chamber together, side-to-side AND top-to-bottom)',
    cooldown_seconds: '30-45 + dry-pull',
    torch_pattern: 'simultaneous_sweep',
    torch_zones: [{ anatomy: 'dish_and_chamber_simultaneously', time_pct: 100 }],
    torch_distance_inches: '0.5-1',
    visual_cue: 'Pillar visibly at temp, faint glow in dim room',
    cold_start_compatible: 'NO',
    tags: ['MFR_SPEC', 'SE_PILLAR'],
    manufacturer_targets_f: {
      solventless: 450,
      hydrocarbon: 550,
    },
    notable_manufacturers: ['Highly Educated'],
  },
  {
    id: 'charmer',
    name: 'Quave Charmer',
    category: 'slurper',
    geometry: 'slurper',
    description:
      'Quave proprietary slurper-blender hybrid. Outer dish with vortex holes, inner cone, three pearls, marble cap.',
    surface_temp_range_f: [450, 580],
    ir_offset_f: 20,
    ir_offset_sign: 1,
    ir_aim_location: 'Side of the cup wall (slurper-class — inferred, no first-party doc)',
    heat_time_seconds: '35-50',
    cooldown_seconds: '30-45',
    torch_pattern: 'circular_sweep',
    torch_zones: [
      { anatomy: 'bottom_skirt_with_vortex_holes', time_pct: 60 },
      { anatomy: 'bucket_walls', time_pct: 40 },
    ],
    torch_distance_inches: '0.5-1',
    visual_cue: 'No glow / faint dish only',
    cold_start_compatible: 'NO',
    tags: ['SLURPER_CLASS'],
    notable_manufacturers: ['Quave Club Banger'],
  },
  {
    id: 'insert',
    name: 'Quartz Insert (in any banger)',
    category: 'specialty',
    geometry: 'insert',
    description:
      'Drop-in cup. Either heat host first then drop insert, or load insert cold and heat host briefly.',
    surface_temp_range_f: [450, 550],
    ir_offset_f: 30,
    ir_offset_sign: -1,
    ir_aim_location: 'Host banger bottom, 1/2" away (read banger temp, not insert directly)',
    heat_time_seconds: '25-35 host (or 10-25 cold-start)',
    cooldown_seconds: '10 (Method 3) / full (Method 1)',
    torch_pattern: 'circular_sweep',
    torch_zones: [
      { anatomy: 'host_banger_bottom', time_pct: 60 },
      { anatomy: 'host_walls', time_pct: 40 },
    ],
    torch_distance_inches: '1-2 (host); never insert',
    visual_cue: 'Per host banger',
    cold_start_compatible: 'YES',
    tags: ['COLD_START_IDEAL'],
    notable_manufacturers: [
      'Eternal Quartz (originator)',
      'Quartz Tech',
      'Halen',
      'Hoyes',
      'Ruby Pearl Co (premium)',
      'Pulsar RoK',
    ],
  },
  {
    id: 'e-banger',
    name: 'E-Banger / E-Nail',
    category: 'specialty',
    geometry: 'enail',
    description:
      'Coil-wrapped quartz with PID. Coil reads 30-80°F hotter than surface (varies widely by brand). MiniNail-on-MiniNail is factory-calibrated to display surface directly.',
    surface_temp_range_f: [500, 600],
    ir_offset_f: 0,
    ir_offset_sign: 0,
    ir_aim_location: 'PID set point — no IR / no torch needed',
    heat_time_seconds: '30 stabilize',
    cooldown_seconds: '0 (PID maintained)',
    torch_pattern: 'none',
    torch_zones: [],
    torch_distance_inches: null,
    visual_cue: 'Coil at set temp',
    cold_start_compatible: 'YES',
    tags: ['ELECTRIC'],
    pid_offset_range_f: [30, 80],
    pid_offset_midpoint_f: 50,
    notable_manufacturers: [
      'MiniNail',
      'VapeBrat',
      'Pulsar Elite',
      'Yo Dabba Dabba',
      'Galaxy Enails',
    ],
  },
] as const;

export function findBanger(id: string): Banger | undefined {
  return BANGERS.find((b) => b.id === id);
}
