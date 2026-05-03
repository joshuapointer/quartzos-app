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
}

interface MoltenRecentRow {
  id: string;
  banger_id: string;
  concentrate_id: string;
  peak_f: number;
  completed_at: number;
}

function rowToRecent(row: MoltenRecentRow): MoltenRecent {
  return {
    id: row.id,
    bangerId: row.banger_id,
    concentrateId: row.concentrate_id,
    peakF: row.peak_f,
    completedAt: row.completed_at,
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
  await db.runAsync(
    'INSERT INTO molten_recents (id, banger_id, concentrate_id, peak_f, completed_at) VALUES (?, ?, ?, ?, ?)',
    [id, input.bangerId, input.concentrateId, input.peakF, now]
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
  };
}
