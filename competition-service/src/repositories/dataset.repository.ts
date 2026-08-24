import { Database } from "sqlite";
import { Dataset } from "../types/competition.types";
import { BaseRepo } from "./base.repository";

/**
 * DatasetRepo is a repository class that handles all database operations related to datasets.
 */
export class DatasetRepo extends BaseRepo<Dataset> {
	constructor(db: Database) {
		super(db, "competition_datasets");
	}

	async createDataset(dataset: Dataset): Promise<Dataset> {
		const sql = `
            INSERT INTO competition_datasets (competitionId, dataset_type, file_name, file_path)
            VALUES (?, ?, ?, ?)
            RETURNING *
        `;
		const result = await this.db.run(sql, [
			dataset.competitionId,
			dataset.dataset_type,
			dataset.file_name,
			dataset.file_path,
		]);

        if (!result) {
            throw new Error("DB Error: Failed to create dataset");
        }
        return result as Dataset;

	}

    async getDatasetsForCompetitionAndType(competitionId: number, datasetType: string): Promise<Dataset[]> {
        const sql = `
            SELECT * FROM competition_datasets
            WHERE competitionId = ? AND dataset_type = ?
        `;
        return await this.db.all(sql, [competitionId, datasetType]);
    }
}
