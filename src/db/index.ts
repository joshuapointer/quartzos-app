import { getDb } from './connection';
import { seedBuiltins } from './presets';

export { getDb };

export async function initDb(): Promise<void> {
  const db = await getDb();
  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  if (!versionRow || versionRow.user_version < 1) {
    await seedBuiltins();
    await db.execAsync('PRAGMA user_version = 1');
  }
}
