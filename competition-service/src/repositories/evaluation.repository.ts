import { Evaluation, EvaluationStatus, UpdateEvaluationDto } from "../types/competition.types";
import { BaseRepo } from "./base.repository";
import { SubmissionRepo } from "./submission.repository";

export class EvaluationRepo extends BaseRepo<Evaluation> {
    
    constructor(db: any) {
        super(db, "competition_evaluations");
    }
    
    async getEvaluationByToken(token: string): Promise<Evaluation | null> {
        const query = `SELECT * FROM ${this.tableName} WHERE token = ?`;
        const row = await this.db.get(query, [token]);
        return row as Evaluation | null;
    }

    async getEvaluationWithCompetitionByToken(token: string): Promise<(Evaluation & {competitionId: number}) | null> {
        const query = `
            SELECT e.*, s.competitionId
            FROM ${this.tableName} e
            JOIN ${SubmissionRepo.tableName} s ON e.submissionId = s.id
            WHERE e.token = ?
        `;
        const row = await this.db.get(query, [token]);
        return (row as (Evaluation & {competitionId: number})) || null;
    }

    async createEvaluation(submissionId: number, token: string, round: number): Promise<Evaluation | null> {
        const status = EvaluationStatus.PENDING;
        const query = `
        INSERT INTO ${this.tableName} (submissionId, token, status, created_at, round)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
        RETURNING *;
        `;
        const evaluation = await this.db.get(query, [submissionId, token, status, round]);
        return evaluation as Evaluation | null;
    }
    async getEvaluationsByCompetitionAndRound(competitionId: number, round: number): Promise<Evaluation[]> {
        const query = `
            SELECT e.*
            FROM ${this.tableName} e
            JOIN ${SubmissionRepo.tableName} s ON e.submissionId = s.id
            WHERE s.competitionId = ? AND e.round = ?
        `;
        const rows = await this.db.all(query, [competitionId, round]);
        return rows as Evaluation[];
    }



    async updateEvaluationStatus(evaluationId: number, updateDto: UpdateEvaluationDto): Promise<boolean> {
      const fieldsToUpdate: string[] = [];
      const values: any[] = [];
      
      // ignore undefined values in updateDto
      for (const [key, value] of Object.entries(updateDto)) {
        if (value !== undefined) {
          fieldsToUpdate.push(`${key} = ?`);
          values.push(value instanceof Date ? value.toISOString() : value);
        }
      }   
      if (fieldsToUpdate.length === 0) {
        return false; // Nothing to update
      }
      
      const query = `
        UPDATE ${this.tableName}
        SET ${fieldsToUpdate.join(", ")}
        WHERE id = ?
      `;
      const result = await this.db.run(query, [...values, evaluationId]);
      return result.changes > 0;        
    }
}