import * as SQLite from 'expo-sqlite';
import { DDL } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('quartzos.db');
    await db.execAsync(DDL);
  }
  return db;
}
