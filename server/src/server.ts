import dotenv from 'dotenv';
import { initializeDB } from './databaseInitializer';
import { createApp } from './createApp';

dotenv.config();

const port = Number(process.env.PORT) || 3000;
const dbPath = process.env.DB_PATH || './happyGoLucky.db';

initializeDB(dbPath).then((db) => {
  console.log("Database initialized, starting server...");

  const app = createApp(db);

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}).catch(error => {
  console.error('Failed to initialize the database:', error);
});
