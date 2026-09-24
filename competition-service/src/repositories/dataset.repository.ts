import { Database } from "sqlite";
import { Dataset, DatasetType } from "../types/competition.types";
import { BaseRepo } from "./base.repository";

/**
 * DatasetRepo is a repository class that handles all database operations related to datasets.
 */
export class DatasetRepo extends BaseRepo<Dataset> {
	constructor(db: Database) {
		super(db, "competition_datasets");
	}

	async createDataset(dataset: Dataset): Promise<Dataset> {
        //TODO: better solution for the round number, maybe a default value in the database schema?
        let result;
		if (dataset.round !== null && dataset.round > 0) {
			const sql = `
            INSERT INTO competition_datasets (competitionId, dataset_type, file_name, file_path, round)
            VALUES (?, ?, ?, ?, ?)
            RETURNING *
        `;
			result = await this.db.get(sql, [
				dataset.competitionId,
				dataset.dataset_type,
				dataset.file_name,
				dataset.file_path,
				dataset.round,
			]);
		} else {
			const sql = `
            INSERT INTO competition_datasets (competitionId, dataset_type, file_name, file_path)
            VALUES (?, ?, ?, ?)
            RETURNING *
        `;
			result = await this.db.get(sql, [
				dataset.competitionId,
				dataset.dataset_type,
				dataset.file_name,
				dataset.file_path,
			]);
		}

		if (!result) {
			throw new Error("DB Error: Failed to create dataset");
		}
		return result as Dataset;
	}

	async getDatasetsForCompetitionRound(competitionId: number, round: number): Promise<Dataset[]> {
		const sql = `
            SELECT * FROM competition_datasets
            WHERE competitionId = ? AND round = ?
        `;
		const datasets = await this.db.all(sql, [competitionId, round]);
		return datasets as Dataset[];
	}

    async getDatasetForCompetitionRoundAndType(competitionId: number, round: number, datasetType: DatasetType): Promise<Dataset | null> {
        const sql = `
            SELECT * FROM competition_datasets
            WHERE competitionId = ? AND round = ? AND dataset_type = ?
        `;
        const dataset = await this.db.get(sql, [competitionId, round, datasetType]);
        return dataset as Dataset | null;
    }
    
    async getTrainingDatasetForCompetition(competitionId: number): Promise<Dataset | null> {
        const sql = `
            SELECT * FROM competition_datasets
            WHERE competitionId = ? AND dataset_type = ?
        `;
        const dataset = await this.db.get(sql, [competitionId, DatasetType.TRAIN]);

        if(dataset && dataset.round !== null) {
            throw new Error(`Training dataset for competition ID ${competitionId} has an invalid round number: ${dataset.round}`);
        }

        return dataset as Dataset | null;
    }
}
