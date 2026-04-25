import { getDb } from './index';
import { DEFAULT_SETTINGS } from '../ble/types';
import type { DeviceSettings } from '../ble/types';

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
  const id = crypto.randomUUID();
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

const BUILTIN_PRESETS: Array<{ id: string; name: string; settings: DeviceSettings }> = [
  {
    id: 'builtin-default',
    name: 'Default',
    settings: DEFAULT_SETTINGS,
  },
  {
    id: 'builtin-darby',
    name: 'Darby',
    settings: { ...DEFAULT_SETTINGS, colors: [0x4B90, 0x4B90, 0x7453, 0xC67A] },
  },
  {
    id: 'builtin-quartz-recommended',
    name: 'Quartz Recommended',
    settings: { ...DEFAULT_SETTINGS, dabAlarmF: 550, dunkAlarmF: 250, opaqueMode: false },
  },
  {
    id: 'builtin-opaque-recommended',
    name: 'Opaque Recommended',
    settings: { ...DEFAULT_SETTINGS, dabAlarmF: 530, dunkAlarmF: 275, opaqueMode: true },
  },
];

export async function seedBuiltins(): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  for (const preset of BUILTIN_PRESETS) {
    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM presets WHERE id = ?',
      [preset.id]
    );
    if (!existing) {
      await db.runAsync(
        'INSERT INTO presets (id, name, settings_json, created_at, updated_at, is_builtin) VALUES (?, ?, ?, ?, ?, 1)',
        [preset.id, preset.name, JSON.stringify(preset.settings), now, now]
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
