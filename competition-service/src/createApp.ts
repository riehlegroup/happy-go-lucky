import cors from 'cors';
import express, { Application } from 'express';
import { Database } from 'sqlite';

export function createApp(db: Database): Application {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.send('Competition Service is running!');
  });

  app.get('/health', async (_req, res) => {
    try {
      await db.get('SELECT 1 AS ok');
      res.json({ status: 'ok' });
    } catch (error) {
      res.status(500).json({ status: 'error' });
    }
  });

  return app;
}