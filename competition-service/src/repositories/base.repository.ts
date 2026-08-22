export abstract class BaseRepo<T> {
  protected constructor(
    protected readonly db: any,
    protected readonly tableName: string,
  ) {}

  async getAll(): Promise<T[]> {
    console.log(`Fetching all records from table: ${this.tableName}`);
    const sql = `SELECT * FROM ${this.tableName}`;
    console.log(`Executing SQL: ${sql}`);
    const result = (await this.db.all(sql)) as T[];
    console.log(`Result: ${JSON.stringify(result)}`);
    return result;
  }

  async getById(id: number): Promise<T | undefined> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    return (await this.db.get(sql, [id])) as T | undefined;
  }

  async deleteById(id: number | string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await this.db.run(sql, [id]);
    return (result.changes ?? 0) > 0;
  }
}
