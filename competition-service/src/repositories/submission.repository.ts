import { Database } from "sqlite";
import { Submission } from "../types/competition.types";
import { BaseRepo } from "./base.repository";

export class SubmissionRepo extends BaseRepo<Submission> {
	public static readonly tableName = "competition_submissions";
    
	constructor(db: Database) {
		super(db, SubmissionRepo.tableName);
	}

	async getSubmissionByCompetitionAndUser(competitionId: number, userId: number): Promise<Submission | null> {
		const query = `SELECT * FROM ${this.tableName} WHERE competitionId = ? AND userId = ?`;
		const row = await this.db.get(query, [competitionId, userId]);
		return row as Submission | null;
	}

	async getAllSubmissionsByCompetition(competitionId: number): Promise<Submission[]> {
		const query = `SELECT * FROM ${this.tableName} WHERE competitionId = ?`;
		const rows = await this.db.all(query, [competitionId]);
		return rows as Submission[];
	}

	async upsertSubmission(competitionId: number, userId: number, apiUrl: string): Promise<Submission> {
		const query = `
            INSERT INTO ${this.tableName} (competitionId, userId, apiUrl, updatedAt)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (competitionId, userId) 
            DO UPDATE SET apiUrl = EXCLUDED.apiUrl, updatedAt = CURRENT_TIMESTAMP
            RETURNING *;
        `;
		return (await this.db.get(query, [competitionId, userId, apiUrl])) as Submission;
	}
}
