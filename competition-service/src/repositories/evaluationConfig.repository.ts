import { EvaluationConfig } from "../types/competition.types";
import { BaseRepo } from "./base.repository";



export class EvaluationConfigRepo extends BaseRepo<EvaluationConfig> {
    constructor(db: any) {
        super(db, "competition_evaluation_configs");
    }

    async getById(id: number): Promise<EvaluationConfig | undefined> {
        const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const result = await this.db.get(sql, [id]);
        if (!result) {
            return undefined;
        }
        return this.mapRowToEvaluationConfig(result);
    }

    private mapRowToEvaluationConfig(row: any): EvaluationConfig {
        return {
            ...row,
            input_column_names: typeof row.input_column_names === "string" ? JSON.parse(row.input_column_names) : row.input_column_names,
            target_columns: typeof row.target_columns === "string" ? JSON.parse(row.target_columns) : row.target_columns,
        };
    }

}