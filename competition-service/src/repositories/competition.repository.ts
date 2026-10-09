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

	async getById(id: number): Promise<Competition | undefined> {
		const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
		const result = await this.db.get(sql, [id]);
		if (!result) {
			return undefined;
		}
		return this.mapRowToCompetition(result);
	}
	async getAll(): Promise<Competition[]> {
		const sql = `SELECT * FROM ${this.tableName}`;
		const results = await this.db.all(sql);
		return results.map((r: any) => this.mapRowToCompetition(r));
	}

	async createCompetition(dto: CreateCompetitionDto): Promise<Competition> {
		const sql =
			`INSERT INTO ${this.tableName} (name, courseId, description, start_date, end_date) VALUES (?, ?, ?, ?, ?) RETURNING *`;
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
		return this.mapRowToCompetition(result);
	}

	async updateCompetition(id: number, dto: UpdateCompetitionDto): Promise<Competition | null> {
		const sql = `
			UPDATE ${this.tableName}
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
		return this.mapRowToCompetition(result);
	}

	async getByCourseId(courseId: number): Promise<Competition[]> {
		const sql = `SELECT * FROM ${this.tableName} WHERE courseId = ?`;
		const results = await this.db.all(sql, [courseId]);
		return results.map((r: any) => this.mapRowToCompetition(r));
	}

	private mapRowToCompetition(row: any): Competition {

		const parseDbDate = (val:string): Date => {
			if(typeof val === "string" && /^\d+$/.test(val)) {
				return new Date(Number(val) * 1000); // Convert seconds to milliseconds
			}
			return new Date(val);
		};
		return {
			id: row.id,
			name: row.name,
			courseId: row.courseId,
			description: row.description,
			startDate: parseDbDate(row.start_date),
			endDate: parseDbDate(row.end_date),
		};
	}
}