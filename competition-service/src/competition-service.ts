import dotenv from 'dotenv';
import { createApp } from './createApp';
import { getDb } from './config/database';

dotenv.config();

const port = Number(process.env.PORT) || 8081;

/**
 * Waits for the database to be initialized and ready (done by server) before starting the Competition Service.
 * @param maxRetries maximum retries to check for database initialization 
 * @param delayMs delay in milliseconds between retries
 * @returns 
 */

async function waitForDatabase(maxRetries = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const db = await getDb();
      await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='competitions';");
      console.log('Competition Service connected to database successfully.');
      return db;
    } catch (error) {
      console.log(`Wait for database initialization (Attempt ${attempt}/${maxRetries})...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Database initialization failed after maximum retries. Ensure the Server component is running and the database is ready.');
}

async function startCompetitionService() {
  const db = await waitForDatabase();
  const app = createApp(db);

  app.listen(port, () => {
    console.log(`Competition Service is running on http://localhost:${port}`);
  });
}

startCompetitionService().catch((error) => {
  console.error('Failed to start Competition Service:', error);
  process.exit(1);
});