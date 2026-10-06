import { Database } from "sqlite";
import { Submission } from "../types/competition.types";
import { BaseRepo } from "./base.repository";
import { NotFoundException } from "../errors/notfound.error";

export class SubmissionRepo extends BaseRepo<Submission> {
	public static readonly TABLE_NAME = "competition_submissions";

	constructor(db: Database) {
		super(db, SubmissionRepo.TABLE_NAME);
	}

	async getSubmissionByCompetitionAndUser(competitionId: number, userId: number): Promise<Submission | null> {
		const query = `SELECT * FROM ${this.tableName} WHERE competitionId = ? AND userId = ?`;
		const row = await this.db.get(query, [competitionId, userId]);
		if(!row) {
			return null;
		}
		return this.mapRowToSubmission(row);
	}

	async getAllSubmissionsByCompetition(competitionId: number): Promise<Submission[]> {
		const query = `SELECT * FROM ${this.tableName} WHERE competitionId = ?`;
		const rows = await this.db.all(query, [competitionId]);
		if (!rows || rows.length === 0) {
			return [];
		}
		return rows.map((row: any) => this.mapRowToSubmission(row));
	}

	async upsertSubmission(competitionId: number, userId: number, apiUrl: string, pseudonym: string): Promise<Submission> {
		const query = `
            INSERT INTO ${this.tableName} (competitionId, userId, apiUrl, updatedAt, pseudonym)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
            ON CONFLICT (competitionId, userId) 
            DO UPDATE SET apiUrl = EXCLUDED.apiUrl, pseudonym = EXCLUDED.pseudonym, updatedAt = CURRENT_TIMESTAMP
            RETURNING *;
        `;
		const result = (await this.db.get(query, [competitionId, userId, apiUrl, pseudonym]));
		return this.mapRowToSubmission(result);
	}

	private mapRowToSubmission(row: any): Submission {
		return {
			id: row.id,
			competitionId: row.competitionId,
			userId: row.userId,
			apiUrl: row.apiUrl,
			pseudonym: row.pseudonym,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		};
	}
}
