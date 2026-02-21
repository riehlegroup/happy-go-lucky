import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { DEFAULT_DB_PATH as SERVER_DEFAULT_DB_PATH } from '../server';
import { DEFAULT_DB_PATH as MOCKDATA_DEFAULT_DB_PATH, generateMockData } from '../scripts/generateMockData';
import { initializeDB } from '../databaseInitializer';

describe('Database filename defaults', () => {
  it('uses happyGoLucky.db as default in server startup', () => {
    expect(SERVER_DEFAULT_DB_PATH).toBe('./happyGoLucky.db');
    expect(SERVER_DEFAULT_DB_PATH).not.toBe('myDatabase.db');
  });

  it('uses happyGoLucky.db as default in mockdata script', () => {
    expect(MOCKDATA_DEFAULT_DB_PATH).toBe('./server/happyGoLucky.db');
    expect(MOCKDATA_DEFAULT_DB_PATH).not.toBe('myDatabase.db');
  });

  it('runs mockdata generation and creates happyGoLucky.db', async () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'happy_go_lucky_'));
    const tempServerDir = resolve(tempRoot, 'server');
    mkdirSync(tempServerDir);

    const dbPath = resolve(tempServerDir, 'happyGoLucky.db');
    try {
      const db = await initializeDB(dbPath, false);
      await db.close();

      await generateMockData(dbPath, false);

      expect(existsSync(dbPath)).toBe(true);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
