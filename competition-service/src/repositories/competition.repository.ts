import { Database } from "sqlite";
import { Competition, CreateCompetitionDto, UpdateCompetitionDto } from "../types/competition.types";
import { BaseRepo } from "./base.repository";
/**
 * CompetitionRepo is a repository class that handles all database operations related to competitions.
 */
export class CompetitionRepo extends BaseRepo<Competition> {
	constructor(db: Database) {
		super(db, "competitions");
	}

	async createCompetition(dto: CreateCompetitionDto): Promise<Competition> {
		const sql =
			"INSERT INTO competitions (name, courseId, description, start_date, end_date) VALUES (?, ?, ?, ?, ?) RETURNING *";
		const result = await this.db.get(sql, [
			dto.name,
			dto.courseId,
			dto.description,
			dto.start_date,
			dto.end_date,
		]);
		if (!result) {
			throw new Error("DB Error: Failed to create competition");
		}
		return result as Competition;
	}

	async updateCompetition(id: number, dto: UpdateCompetitionDto): Promise<Competition | null> {
		const sql = `
			UPDATE competitions
			SET name = ?, description = ?, start_date = ?, end_date = ?
			WHERE id = ?
			RETURNING *
		`;
		const result = await this.db.get(sql, [
			dto.name,
			dto.description,
			dto.start_date,
			dto.end_date,
			id,
		]);
		if (!result) {
			throw new Error(`DB Error: Failed to update competition with ID ${id}`);
		}
		return result as Competition | null;
	}

	async getByCourseId(courseId: number): Promise<Competition[]> {
		const sql = "SELECT * FROM competitions WHERE courseId = ?";
		const results = await this.db.all(sql, [courseId]);
		return results as Competition[];
	}
}