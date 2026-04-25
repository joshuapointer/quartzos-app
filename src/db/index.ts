import * as SQLite from 'expo-sqlite';
import { DDL } from './schema';
import { seedBuiltins } from './presets';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('quartzos.db');
    await db.execAsync(DDL);

    const versionRow = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    );
    if (!versionRow || versionRow.user_version < 1) {
      await seedBuiltins();
      await db.execAsync('PRAGMA user_version = 1');
    }
  }
  return db;
}
