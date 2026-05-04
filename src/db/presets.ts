import { getDb } from './connection';
import { siriBridge } from '../native/siriBridge';
import { DEFAULT_SETTINGS } from '../ble/types';
import type { DeviceSettings } from '../ble/types';
import { findBanger } from '../data/bangers';
import { findConcentrate } from '../data/concentrates';
import { findSensor } from '../data/sensors';
import { findWallThickness } from '../data/wallThicknesses';
import { computeDisplayedTarget } from '../utils/calibration';
import { CALIBRATION_CONSTANTS } from '../data/calibrationConstants';
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

// Mirror the preset list to the iOS App Group so Siri App Intents can
// surface preset names without booting the JS runtime. Best-effort —
// the Siri bridge swallows native errors.
async function syncSiriCatalog(): Promise<void> {
  try {
    const all = await getAll();
    siriBridge.setPresetCatalog(all);
  } catch {
    /* mirror is non-critical; SQLite remains source of truth */
  }
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
  void syncSiriCatalog();
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
  void syncSiriCatalog();
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
  void syncSiriCatalog();
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
 * `dabAlarmF` to the nearest 5°F.
 *
 * Pass `overrideInteriorF` for manufacturer-target presets (Control Tower):
 * the override replaces both surface_temp_optimal_f and fluid_target_optimal_f
 * (= override − phase_change_load_f) so the v2 IR formula stays consistent.
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

  const effectiveConcentrate: Concentrate =
    overrideInteriorF !== undefined
      ? {
          ...concentrate,
          surface_temp_optimal_f: overrideInteriorF,
          fluid_target_optimal_f: overrideInteriorF - CALIBRATION_CONSTANTS.phase_change_load_f,
        }
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

// --- v2 spec examples 1-6: schema.calibration.examples ---
//
// Live Rosin · Flat Top · IR · Std    → 520°F (T_Ideal 415 + load 65 + grad 25 + ε 15)
// Live Rosin · Opaque Bottom · IR · Std → 518°F (415 + 65 + 35 + 3, Opaque preset)
// Live Rosin · Blender · IR · Std     → 510°F (415 + 65 + 15 + 15)
// Live Rosin · Flat Top · Probe · Std → 480°F (surface direct)
// Live Rosin · E-Banger · PID         → 530°F (480 + 50 PID coil)
// Cold Cure Rosin · Terp Slurper · IR · Std → 490°F (395 + 65 + 15 + 15)

const _ex1 = computeAlarms('live-rosin', 'flat-top', 'ir', 'standard');
const _ex2 = computeAlarms('live-rosin', 'opaque-bottom', 'ir', 'standard');
const _ex3 = computeAlarms('live-rosin', 'blender', 'ir', 'standard');
const _ex4 = computeAlarms('live-rosin', 'flat-top', 'probe', 'standard');
const _ex5 = computeAlarms('live-rosin', 'e-banger', 'enail', 'standard');
const _ex6 = computeAlarms('cold-cure', 'terp-slurper', 'ir', 'standard');

// --- Brand-anchored picks ---
//
// 7. HE Control Tower Solventless → mfr target 450 surface (slurper IR)
//    480°F (385 fluid + 65 + 15 + 15)
// 8. HE Control Tower Hydrocarbon → mfr target 550 surface (slurper IR)
//    580°F (485 fluid + 65 + 15 + 15)
// 9. Hashwriter 6-Star (Live Rosin proxy) · Round Bottom · Probe · Std
//    480°F (probe = surface direct)

const _ex7 = computeAlarms('live-rosin', 'control-tower', 'ir', 'standard', 450);
const _ex8 = computeAlarms('live-resin', 'control-tower', 'ir', 'standard', 550);
const _ex9 = computeAlarms('live-rosin', 'round-bottom', 'probe', 'standard');

// --- Spec self-assertion: verifies calibration engine matches worked examples --
function __verifyExamples(): void {
  const checkClose = (label: string, computed: number, expected: number, tolF: number) => {
    if (Math.abs(computed - expected) > tolF) {
      throw new Error(
        `[presets] Calibration regression: ${label} expected ~${expected}°F (±${tolF}) but got ${computed}°F. ` +
        'Check src/utils/calibration.ts for changes.',
      );
    }
  };
  checkClose('Live Rosin · Flat Top · IR · Std', _ex1.dabAlarmF, 520, 3);
  checkClose('Live Rosin · Opaque Bottom · IR · Std', _ex2.dabAlarmF, 518, 3);
  checkClose('Live Rosin · Blender · IR · Std', _ex3.dabAlarmF, 510, 3);
  checkClose('Live Rosin · Flat Top · Probe · Std', _ex4.dabAlarmF, 480, 1);
  checkClose('Live Rosin · E-Banger · PID', _ex5.dabAlarmF, 530, 1);
  checkClose('Cold Cure · Terp Slurper · IR · Std', _ex6.dabAlarmF, 490, 3);
}

const BUILTIN_PRESETS: ReadonlyArray<{ id: string; name: string; settings: DeviceSettings }> = [
  {
    id: 'builtin-live-rosin-flat-top-ir',
    name: 'Live Rosin · Flat Top · IR',
    settings: { ...DEFAULT_SETTINGS, ..._ex1, opaqueMode: false },
  },
  {
    id: 'builtin-live-rosin-opaque-ir',
    name: 'Live Rosin · Opaque Bottom · IR',
    settings: { ...DEFAULT_SETTINGS, ..._ex2, opaqueMode: true },
  },
  {
    id: 'builtin-live-rosin-blender-ir',
    name: 'Live Rosin · Blender · IR',
    settings: { ...DEFAULT_SETTINGS, ..._ex3, opaqueMode: false },
  },
  {
    id: 'builtin-live-rosin-flat-top-probe',
    name: 'Live Rosin · Flat Top · Probe',
    settings: { ...DEFAULT_SETTINGS, ..._ex4, opaqueMode: false },
  },
  {
    id: 'builtin-live-rosin-e-banger',
    name: 'Live Rosin · E-Banger · PID',
    settings: { ...DEFAULT_SETTINGS, ..._ex5, opaqueMode: false },
  },
  {
    id: 'builtin-cold-cure-slurper-ir',
    name: 'Cold Cure · Terp Slurper · IR',
    settings: { ...DEFAULT_SETTINGS, ..._ex6, opaqueMode: false },
  },
  {
    id: 'builtin-he-control-tower-solventless',
    name: 'HE Control Tower Solventless',
    settings: { ...DEFAULT_SETTINGS, ..._ex7, opaqueMode: false },
  },
  {
    id: 'builtin-he-control-tower-hydrocarbon',
    name: 'HE Control Tower Hydrocarbon',
    settings: { ...DEFAULT_SETTINGS, ..._ex8, opaqueMode: false },
  },
  {
    id: 'builtin-hashwriter-6star-round-probe',
    name: 'Hashwriter 6-Star · Round Bottom · Probe',
    settings: { ...DEFAULT_SETTINGS, ..._ex9, opaqueMode: false },
  },
];

/** IDs of every preset in the current roster — used for cleanup in seedBuiltins. */
const BUILTIN_IDS = new Set(BUILTIN_PRESETS.map((p) => p.id));

export async function seedBuiltins(): Promise<void> {
  // Run the spec self-assertion on every cold boot — catches calibration regressions.
  __verifyExamples();

  const db = await getDb();
  const now = Date.now();

  // 1. Remove stale builtins not in the current roster.
  const existingBuiltins = await db.getAllAsync<{ id: string }>(
    "SELECT id FROM presets WHERE id LIKE 'builtin-%'",
  );
  for (const row of existingBuiltins) {
    if (!BUILTIN_IDS.has(row.id)) {
      await db.runAsync('DELETE FROM presets WHERE id = ?', [row.id]);
    }
  }

  // 2. Upsert each current builtin.
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

  void syncSiriCatalog();
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
