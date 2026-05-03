import { getDb } from './connection';
import { siriBridge } from '../native/siriBridge';

// Portable UUID v4 — Hermes/React Native's `crypto.randomUUID` is not
// reliably available across runtimes, so we generate locally. Sufficient
// for SQLite primary keys (collision risk for ~10^15 ids is negligible).
function uuidv4(): string {
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

export interface TempSample { t: number; f: number; }
export interface AlertRecord { kind: 'dab' | 'dunk'; at: number; }

export interface SessionRecord {
  id: string;
  startedAt: number;
  endedAt: number | null;
  peakTempF: number;
  dabAlarmF: number;
  dunkAlarmF: number;
  samples: TempSample[];
  alerts: AlertRecord[];
  presetId?: string | null;
  notes?: string | null;
}

interface SessionRow {
  id: string;
  started_at: number;
  ended_at: number | null;
  peak_temp_f: number;
  dab_alarm_f: number;
  dunk_alarm_f: number;
  samples_json: string;
  alerts_json: string;
  preset_id: string | null;
  notes: string | null;
}

function rowToSession(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    peakTempF: row.peak_temp_f,
    dabAlarmF: row.dab_alarm_f,
    dunkAlarmF: row.dunk_alarm_f,
    samples: JSON.parse(row.samples_json) as TempSample[],
    alerts: JSON.parse(row.alerts_json) as AlertRecord[],
    presetId: row.preset_id,
    notes: row.notes,
  };
}

export async function getAll(limit = 100): Promise<SessionRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SessionRow>(
    'SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?',
    [limit]
  );
  return rows.map(rowToSession);
}

export async function getById(id: string): Promise<SessionRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SessionRow>(
    'SELECT * FROM sessions WHERE id = ?',
    [id]
  );
  return row ? rowToSession(row) : null;
}

export async function create(
  partial: Omit<SessionRecord, 'id' | 'endedAt'>
): Promise<SessionRecord> {
  const db = await getDb();
  const id = uuidv4();
  await db.runAsync(
    `INSERT INTO sessions
       (id, started_at, ended_at, peak_temp_f, dab_alarm_f, dunk_alarm_f,
        samples_json, alerts_json, preset_id, notes)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      partial.startedAt,
      partial.peakTempF,
      partial.dabAlarmF,
      partial.dunkAlarmF,
      JSON.stringify(partial.samples),
      JSON.stringify(partial.alerts),
      partial.presetId ?? null,
      partial.notes ?? null,
    ]
  );
  return { id, endedAt: null, ...partial };
}

export async function end(
  id: string,
  endedAt: number,
  peakTempF: number,
  samples: TempSample[],
  alerts: AlertRecord[]
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE sessions
     SET ended_at = ?, peak_temp_f = ?, samples_json = ?, alerts_json = ?
     WHERE id = ?`,
    [endedAt, peakTempF, JSON.stringify(samples), JSON.stringify(alerts), id]
  );

  // Mirror the just-completed session's preset id to the App Group so the
  // "Start last session" Siri intent can resolve without booting JS. We
  // re-read the row instead of plumbing presetId through every caller.
  try {
    const row = await db.getFirstAsync<{ preset_id: string | null }>(
      'SELECT preset_id FROM sessions WHERE id = ?',
      [id],
    );
    if (row?.preset_id) {
      siriBridge.setLastPresetId(row.preset_id);
    }
  } catch {
    /* mirror is best-effort */
  }
}

export async function addNote(id: string, notes: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE sessions SET notes = ? WHERE id = ?', [notes, id]);
}

export async function remove(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
}

export async function clearAll(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sessions');
}

export async function exportAllJson(): Promise<string> {
  const sessions = await getAll(Number.MAX_SAFE_INTEGER);
  return JSON.stringify(sessions);
}
