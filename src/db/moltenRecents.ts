import { getDb } from './connection';

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

export interface MoltenRecent {
  id: string;
  bangerId: string;
  concentrateId: string;
  peakF: number;
  completedAt: number;
  /** Adjusted dab alarm at session complete (sensor-display space). */
  dabAlarmF: number | null;
  /** Adjusted dunk alarm at session complete. */
  dunkAlarmF: number | null;
  /** Adjusted torch duration at session complete (seconds). */
  torchS: number | null;
}

interface MoltenRecentRow {
  id: string;
  banger_id: string;
  concentrate_id: string;
  peak_f: number;
  completed_at: number;
  dab_alarm_f: number | null;
  dunk_alarm_f: number | null;
  torch_s: number | null;
}

function rowToRecent(row: MoltenRecentRow): MoltenRecent {
  return {
    id: row.id,
    bangerId: row.banger_id,
    concentrateId: row.concentrate_id,
    peakF: row.peak_f,
    completedAt: row.completed_at,
    dabAlarmF: row.dab_alarm_f,
    dunkAlarmF: row.dunk_alarm_f,
    torchS: row.torch_s,
  };
}

export async function ensureSchema(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS molten_recents (
      id TEXT PRIMARY KEY NOT NULL,
      banger_id TEXT NOT NULL,
      concentrate_id TEXT NOT NULL,
      peak_f REAL NOT NULL,
      completed_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_molten_recents_completed_at
      ON molten_recents (completed_at DESC);
  `);
  // Additive migration: add adjusted-value columns. SQLite throws if column
  // already exists — swallow that specific error so the migration is idempotent.
  for (const col of [
    'dab_alarm_f INTEGER',
    'dunk_alarm_f INTEGER',
    'torch_s INTEGER',
  ]) {
    try {
      await db.execAsync(`ALTER TABLE molten_recents ADD COLUMN ${col};`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/duplicate column name/i.test(msg)) throw err;
    }
  }
}

export async function getRecent(limit = 4): Promise<MoltenRecent[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MoltenRecentRow>(
    'SELECT * FROM molten_recents ORDER BY completed_at DESC LIMIT ?',
    [limit]
  );
  return rows.map(rowToRecent);
}

export async function record(input: {
  bangerId: string;
  concentrateId: string;
  peakF: number;
  dabAlarmF?: number | null;
  dunkAlarmF?: number | null;
  torchS?: number | null;
}): Promise<MoltenRecent> {
  const db = await getDb();
  // Dedupe head: if the most recent has same banger+concentrate, skip.
  const head = await db.getFirstAsync<MoltenRecentRow>(
    'SELECT * FROM molten_recents ORDER BY completed_at DESC LIMIT 1'
  );
  if (
    head &&
    head.banger_id === input.bangerId &&
    head.concentrate_id === input.concentrateId
  ) {
    return rowToRecent(head);
  }
  const id = uuidv4();
  const now = Date.now();
  const dabAlarmF = input.dabAlarmF ?? null;
  const dunkAlarmF = input.dunkAlarmF ?? null;
  const torchS = input.torchS ?? null;
  await db.runAsync(
    'INSERT INTO molten_recents (id, banger_id, concentrate_id, peak_f, completed_at, dab_alarm_f, dunk_alarm_f, torch_s) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, input.bangerId, input.concentrateId, input.peakF, now, dabAlarmF, dunkAlarmF, torchS]
  );
  // Cap at 50 rows (defense against unbounded growth)
  await db.runAsync(
    'DELETE FROM molten_recents WHERE id NOT IN (SELECT id FROM molten_recents ORDER BY completed_at DESC LIMIT 50)'
  );
  return {
    id,
    bangerId: input.bangerId,
    concentrateId: input.concentrateId,
    peakF: input.peakF,
    completedAt: now,
    dabAlarmF,
    dunkAlarmF,
    torchS,
  };
}
