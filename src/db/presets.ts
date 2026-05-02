import { getDb } from './connection';
import { DEFAULT_SETTINGS } from '../ble/types';
import type { DeviceSettings } from '../ble/types';
import { findBanger } from '../data/bangers';
import { findConcentrate } from '../data/concentrates';
import { findSensor } from '../data/sensors';
import { findWallThickness } from '../data/wallThicknesses';
import { computeDisplayedTarget } from '../utils/calibration';
import type { Banger } from '../data/bangers';
import type { Concentrate } from '../data/concentrates';
import type { Sensor } from '../data/sensors';
import type { WallThickness } from '../data/wallThicknesses';

// Portable UUID v4 — Hermes/React Native's `crypto.randomUUID` is not
// reliably available across runtimes, so we generate locally. Sufficient
// for SQLite primary keys (collision risk for ~10^15 ids is negligible).
function uuidv4(): string {
  // Pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // y is one of 8/9/a/b
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      out += '-';
    } else if (i === 14) {
      out += '4';
    } else if (i === 19) {
      out += hex[(Math.random() * 4) | 0 | 8];
    } else {
      out += hex[(Math.random() * 16) | 0];
    }
  }
  return out;
}

export interface Preset {
  id: string;
  name: string;
  settings: DeviceSettings;
  createdAt: number;
  updatedAt: number;
  isBuiltIn: boolean;
  iconSlot?: number;
}

interface PresetRow {
  id: string;
  name: string;
  settings_json: string;
  created_at: number;
  updated_at: number;
  is_builtin: number;
  icon_slot: number | null;
}

function rowToPreset(row: PresetRow): Preset {
  return {
    id: row.id,
    name: row.name,
    settings: JSON.parse(row.settings_json) as DeviceSettings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isBuiltIn: row.is_builtin === 1,
    iconSlot: row.icon_slot ?? undefined,
  };
}

export async function getAll(): Promise<Preset[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<PresetRow>(
    'SELECT * FROM presets ORDER BY is_builtin DESC, created_at DESC'
  );
  return rows.map(rowToPreset);
}

export async function getById(id: string): Promise<Preset | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<PresetRow>(
    'SELECT * FROM presets WHERE id = ?',
    [id]
  );
  return row ? rowToPreset(row) : null;
}

export async function create(
  name: string,
  settings: DeviceSettings
): Promise<Preset> {
  const db = await getDb();
  const id = uuidv4();
  const now = Date.now();
  await db.runAsync(
    'INSERT INTO presets (id, name, settings_json, created_at, updated_at, is_builtin) VALUES (?, ?, ?, ?, ?, 0)',
    [id, name, JSON.stringify(settings), now, now]
  );
  return {
    id,
    name,
    settings,
    createdAt: now,
    updatedAt: now,
    isBuiltIn: false,
  };
}

export async function update(
  id: string,
  partial: { name?: string; settings?: DeviceSettings; iconSlot?: number }
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (partial.name !== undefined) {
    fields.push('name = ?');
    values.push(partial.name);
  }
  if (partial.settings !== undefined) {
    fields.push('settings_json = ?');
    values.push(JSON.stringify(partial.settings));
  }
  if (partial.iconSlot !== undefined) {
    fields.push('icon_slot = ?');
    values.push(partial.iconSlot);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  await db.runAsync(
    `UPDATE presets SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function remove(id: string): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ is_builtin: number }>(
    'SELECT is_builtin FROM presets WHERE id = ?',
    [id]
  );
  if (!row) return;
  if (row.is_builtin === 1) {
    throw new Error('Cannot delete a built-in preset');
  }
  await db.runAsync('DELETE FROM presets WHERE id = ?', [id]);
}

// ---------------------------------------------------------------------------
// Helpers — resolve catalog entries with guaranteed presence at module load.
// ---------------------------------------------------------------------------

function mustFindBanger(id: string): Banger {
  const b = findBanger(id);
  if (!b) throw new Error(`[presets] Banger not found: ${id}`);
  return b;
}

function mustFindConcentrate(id: string): Concentrate {
  const c = findConcentrate(id);
  if (!c) throw new Error(`[presets] Concentrate not found: ${id}`);
  return c;
}

function mustFindSensor(id: string): Sensor {
  const s = findSensor(id);
  if (!s) throw new Error(`[presets] Sensor not found: ${id}`);
  return s;
}

function mustFindWall(id: string): WallThickness {
  const w = findWallThickness(id);
  if (!w) throw new Error(`[presets] WallThickness not found: ${id}`);
  return w;
}

/**
 * Compute `{ dabAlarmF, dunkAlarmF }` from a calibration tuple, rounding
 * `dabAlarmF` to the nearest 5°F as the spec requires.
 *
 * Pass `overrideInteriorF` for the two Control Tower presets whose
 * manufacturer_targets_f values replace the concentrate's
 * `surface_temp_optimal_f`. The override is applied by cloning the concentrate
 * with the manufacturer target as `surface_temp_optimal_f`.
 */
function computeAlarms(
  concentrateId: string,
  bangerId: string,
  sensorId: string,
  wallId: string,
  overrideInteriorF?: number,
): { dabAlarmF: number; dunkAlarmF: number } {
  const concentrate = mustFindConcentrate(concentrateId);
  const banger = mustFindBanger(bangerId);
  const sensor = mustFindSensor(sensorId);
  const wall = mustFindWall(wallId);

  // For Control Tower mfr-target overrides, substitute the concentrate's
  // optimal temp so the calibration engine receives the correct interior value.
  const effectiveConcentrate: Concentrate =
    overrideInteriorF !== undefined
      ? { ...concentrate, surface_temp_optimal_f: overrideInteriorF }
      : concentrate;

  const result = computeDisplayedTarget({
    concentrate: effectiveConcentrate,
    banger,
    sensor,
    wall,
  });

  const dabAlarmF = Math.round(result.displayedF / 5) * 5;
  const dunkAlarmF = result.dunkF;
  return { dabAlarmF, dunkAlarmF };
}

// ---------------------------------------------------------------------------
// BUILTIN_PRESETS — computed at module load (cheap, readable, regression-safe)
// ---------------------------------------------------------------------------

// --- Spec examples 1-5: schema.calibration.examples (EXACT) ---
//
// Expected displayed values (before rounding to 5°F):
//   1. Live Resin · Flat Top · IR · Std     → 475°F  (round-5: 475)
//   2. Live Resin · Blender · IR · Std      → 530°F  (round-5: 530)
//   3. Cold Cure Rosin · Slurper · IR · Std → 480°F  (round-5: 480)
//   4. Live Resin · Flat Top · Probe · Std  → 510°F  (round-5: 510)
//   5. Live Resin · E-Banger · PID · Std    → 560°F  (round-5: 560)

const _ex1 = computeAlarms('live-resin', 'flat-top', 'ir', 'standard');
const _ex2 = computeAlarms('live-resin', 'blender', 'ir', 'standard');
const _ex3 = computeAlarms('cold-cure', 'terp-slurper', 'ir', 'standard');
const _ex4 = computeAlarms('live-resin', 'flat-top', 'probe', 'standard');
const _ex5 = computeAlarms('live-resin', 'e-banger', 'enail', 'standard');

// --- Spec self-assertion: verifies calibration engine matches worked examples --
function __verifyExamples(): void {
  const check = (label: string, computed: number, expected: number) => {
    if (computed !== expected) {
      throw new Error(
        `[presets] Calibration regression: ${label} expected ${expected}°F but got ${computed}°F. ` +
        'Check src/utils/calibration.ts for changes.',
      );
    }
  };
  check('Live Resin · Flat Top · IR · Std (ex1)', _ex1.dabAlarmF, 475);
  check('Live Resin · Blender · IR · Std (ex2)', _ex2.dabAlarmF, 530);
  check('Cold Cure Rosin · Slurper · IR · Std (ex3)', _ex3.dabAlarmF, 480);
  check('Live Resin · Flat Top · Probe · Std (ex4)', _ex4.dabAlarmF, 510);
  check('Live Resin · E-Banger · PID · Std (ex5)', _ex5.dabAlarmF, 560);
}

// --- Brand-anchored picks 6-10 ---
//
// 6.  710 Labs Live Rosin · Round Bottom · IR · Std
//     interior=480, offset=-35 → 445°F (round-5: 445)
// 7.  Press Club Temple Ball · Round Bottom · IR · Std
//     interior=400, offset=-35 → 365°F (round-5: 365)
// 8.  HE Control Tower Solventless · Control Tower · IR · Std
//     override interior=450 (mfr target), slurper offset=+20 → 470°F (round-5: 470)
// 9.  HE Control Tower Hydrocarbon · Control Tower · IR · Std
//     override interior=550 (mfr target), slurper offset=+20 → 570°F (round-5: 570)
// 10. Hashwriter 6-Star · Round Bottom · Probe · Std
//     interior=490, probe offset=0 → 490°F (round-5: 490)

const _ex6 = computeAlarms('live-rosin', 'round-bottom', 'ir', 'standard');
const _ex7 = computeAlarms('live-rosin', 'round-bottom', 'ir', 'standard');
// Control Tower: manufacturer_targets_f.solventless = 450
const _ex8 = computeAlarms('live-rosin', 'control-tower', 'ir', 'standard', 450);
// Control Tower: manufacturer_targets_f.hydrocarbon = 550
const _ex9 = computeAlarms('live-resin', 'control-tower', 'ir', 'standard', 550);
const _ex10 = computeAlarms('live-rosin', 'round-bottom', 'probe', 'standard');

const BUILTIN_PRESETS: ReadonlyArray<{ id: string; name: string; settings: DeviceSettings }> = [
  // 1 — Live Resin · Flat Top · IR · Std → 475°F dab / 200°F dunk
  {
    id: 'builtin-live-resin-flat-top-ir',
    name: 'Live Resin · Flat Top · IR',
    settings: { ...DEFAULT_SETTINGS, ..._ex1, opaqueMode: false },
  },
  // 6 — 710 Labs Live Rosin · Round Bottom · IR · Std → 445°F dab / 200°F dunk
  {
    id: 'builtin-710-live-rosin-round-ir',
    name: '710 Labs Live Rosin · Round Bottom · IR',
    settings: { ...DEFAULT_SETTINGS, ..._ex6, opaqueMode: false },
  },
  // 7 — Press Club Temple Ball · Round Bottom · IR · Std → 365°F dab / 200°F dunk
  {
    id: 'builtin-temple-ball-round-ir',
    name: 'Press Club Temple Ball · Round Bottom · IR',
    settings: { ...DEFAULT_SETTINGS, ..._ex7, opaqueMode: false },
  },
  // 8 — HE Control Tower Solventless · Control Tower · IR · Std → 470°F dab / 200°F dunk
  //     Uses manufacturer_targets_f.solventless = 450°F as interior override
  {
    id: 'builtin-he-control-tower-solventless',
    name: 'HE Control Tower Solventless',
    settings: { ...DEFAULT_SETTINGS, ..._ex8, opaqueMode: false },
  },
  // 9 — HE Control Tower Hydrocarbon · Control Tower · IR · Std → 570°F dab / 290°F dunk
  //     Uses manufacturer_targets_f.hydrocarbon = 550°F as interior override
  {
    id: 'builtin-he-control-tower-hydrocarbon',
    name: 'HE Control Tower Hydrocarbon',
    settings: { ...DEFAULT_SETTINGS, ..._ex9, opaqueMode: false },
  },
  // 10 — Hashwriter 6-Star · Round Bottom · Probe · Std → 490°F dab / 210°F dunk
  {
    id: 'builtin-hashwriter-6star-round-probe',
    name: 'Hashwriter 6-Star · Round Bottom · Probe',
    settings: { ...DEFAULT_SETTINGS, ..._ex10, opaqueMode: false },
  },
];

/** IDs of every preset in the current roster — used for cleanup in seedBuiltins. */
const BUILTIN_IDS = new Set(BUILTIN_PRESETS.map((p) => p.id));

export async function seedBuiltins(): Promise<void> {
  // Run the spec self-assertion on every cold boot — catches calibration regressions.
  __verifyExamples();

  const db = await getDb();
  const now = Date.now();

  // 1. Remove stale builtins not in the current roster (e.g., builtin-default,
  //    builtin-darby, builtin-quartz-recommended, builtin-opaque-recommended).
  const existingBuiltins = await db.getAllAsync<{ id: string }>(
    "SELECT id FROM presets WHERE id LIKE 'builtin-%'",
  );
  for (const row of existingBuiltins) {
    if (!BUILTIN_IDS.has(row.id)) {
      await db.runAsync('DELETE FROM presets WHERE id = ?', [row.id]);
    }
  }

  // 2. Upsert each current builtin — insert if missing, update name+settings if present.
  for (const preset of BUILTIN_PRESETS) {
    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM presets WHERE id = ?',
      [preset.id],
    );
    if (!existing) {
      await db.runAsync(
        'INSERT INTO presets (id, name, settings_json, created_at, updated_at, is_builtin) VALUES (?, ?, ?, ?, ?, 1)',
        [preset.id, preset.name, JSON.stringify(preset.settings), now, now],
      );
    } else {
      await db.runAsync(
        'UPDATE presets SET name = ?, settings_json = ?, updated_at = ? WHERE id = ?',
        [preset.name, JSON.stringify(preset.settings), now, preset.id],
      );
    }
  }
}

export async function importFromJson(json: string): Promise<Preset | null> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) return null;

  const obj = parsed as Record<string, unknown>;

  const name = typeof obj.name === 'string' ? obj.name : null;
  const settings = obj.settings as Partial<DeviceSettings> | undefined;

  if (!name || !settings) return null;

  const dabAlarmF = typeof settings.dabAlarmF === 'number' ? settings.dabAlarmF : null;
  const dunkAlarmF = typeof settings.dunkAlarmF === 'number' ? settings.dunkAlarmF : null;

  if (dabAlarmF === null || dunkAlarmF === null) return null;
  if (dabAlarmF < 100 || dabAlarmF > 900) return null;
  if (dunkAlarmF < 100 || dunkAlarmF > 900) return null;
  if (dunkAlarmF >= dabAlarmF) return null;

  const fullSettings: DeviceSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
    dabAlarmF,
    dunkAlarmF,
  };

  return create(name, fullSettings);
}

export function exportToJson(preset: Preset): string {
  return JSON.stringify({ name: preset.name, settings: preset.settings });
}
