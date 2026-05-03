import { getDb } from './connection';
import { seedBuiltins } from './presets';
import { ensureSchema as ensureMoltenRecentsSchema } from './moltenRecents';

export { getDb };

export async function initDb(): Promise<void> {
  const db = await getDb();
  // Always run additive table-creation guards so new tables added after
  // user_version=1 still get created on existing installs.
  await ensureMoltenRecentsSchema();
  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  if (!versionRow || versionRow.user_version < 1) {
    await seedBuiltins();
    await db.execAsync('PRAGMA user_version = 1');
  }
}
