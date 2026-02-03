import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { generateMockData } from '../scripts/generateMockData';
import { initializeDB } from '../databaseInitializer';

describe('Database filename defaults', () => {
  const srcRoot = resolve(__dirname, '..');

  it('uses happyGoLucky.db as default in server startup', () => {
    const serverTs = resolve(srcRoot, 'server.ts');
    const source = readFileSync(serverTs, 'utf8');

    expect(source).toContain('./happyGoLucky.db');
    expect(source).not.toContain('myDatabase.db');
  });

  it('uses happyGoLucky.db as default in mockdata script', () => {
    const scriptTs = resolve(srcRoot, 'scripts', 'generateMockData.ts');
    const source = readFileSync(scriptTs, 'utf8');

    expect(source).toContain('happyGoLucky.db');
    expect(source).not.toContain('myDatabase.db');
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

      expect(basename(dbPath)).toBe('happyGoLucky.db');
      expect(existsSync(dbPath)).toBe(true);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
