# First run (Windows)

On a fresh setup, the SQLite schema is created when the server starts.

If you run `npm run generate-mockdata` before the schema exists, you may see:
`SQLITE_ERROR: no such table: happiness`.

Workaround:
1. Start the server once:
   `npm run dev --prefix server`
2. Then generate mock data:
   `npm run generate-mockdata`
