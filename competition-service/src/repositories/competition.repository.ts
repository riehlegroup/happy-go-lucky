import { Database } from "sqlite";
import { Competition, CreateCompetitionDto } from "../types/competition.types";
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

	async getByCourseId(courseId: number): Promise<Competition[]> {
		const sql = "SELECT * FROM competitions WHERE courseId = ?";
		const results = await this.db.all(sql, [courseId]);
		return results as Competition[];
	}
}