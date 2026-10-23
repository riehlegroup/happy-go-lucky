import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbInstance: Database | null = null;

function resolveDatabasePath(): string {
  if (process.env.DB_PATH && process.env.DB_PATH.trim() !== '') {
    return process.env.DB_PATH;
  }

  return path.join(__dirname, '../../../server/happyGoLucky.db');
}

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = resolveDatabasePath();

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await dbInstance.run('PRAGMA foreign_keys = ON;');
  await dbInstance.run('PRAGMA journal_mode = WAL;');
  await dbInstance.run('PRAGMA busy_timeout = 5000;');
  await dbInstance.run('PRAGMA synchronous = NORMAL;');

  return dbInstance;
}
