import dotenv from 'dotenv';
import { initializeDB } from './databaseInitializer';
import { createApp } from './createApp';

dotenv.config();

const port = Number(process.env.PORT) || 3000;
const dbPath = process.env.DB_PATH || './myDatabase.db';

initializeDB(dbPath).then((db) => {
  console.log("Database initialized, starting server...");

  const app = createApp(db);

  let shutdownInProgress = false;
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  const gracefulShutdown = async (reason: string) => {
    if (shutdownInProgress) {
      return;
    }
    shutdownInProgress = true;

    console.log(`Graceful shutdown initiated (${reason})...`);
    app.locals.isShuttingDown = true;

    // Stop accepting new connections, wait for in-flight requests.
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });

    try {
      await db.close();
      console.log("Database connection closed.");
    } catch (error) {
      console.error("Failed to close database connection:", error);
    }

    // In production we explicitly exit to ensure container stops.
    if (process.env.NODE_ENV !== 'test') {
      process.exit(0);
    }
  };

  // Also handle OS signals (docker stop, Ctrl+C).
  process.on('SIGTERM', () => {
    void gracefulShutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void gracefulShutdown('SIGINT');
  });
}).catch(error => {
  console.error('Failed to initialize the database:', error);
});
