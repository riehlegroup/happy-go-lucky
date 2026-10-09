import { LeaderboardEntry, PaginationDatabaseResult, PaginationQuery, RoundResultForUserDto } from "../types/competition.types";
import { EvaluationRepo } from "./evaluation.repository";
import { SubmissionRepo } from "./submission.repository";

export class LeaderboardRepo {
    
    constructor(private db: any) {}

    async getPaginatedLeaderboardForRound(competitionId: number, round: number, pagination: PaginationQuery): Promise<PaginationDatabaseResult<LeaderboardEntry>> {
        const { page, limit } = pagination;
        const offset = (page - 1) * limit;

        const countQuery = `
            SELECT COUNT(*) as totalItems
            FROM ${EvaluationRepo.TABLE_NAME} e
            JOIN ${SubmissionRepo.TABLE_NAME} s ON e.submissionId = s.id
            WHERE s.competitionId = ? AND e.round = ?;
        `;
        const countRow = await this.db.get(countQuery, [competitionId, round]);
        const totalItems = countRow ? countRow.totalItems : 0;

        const query = `
            SELECT s.pseudonym, e.score, e.inference_time_ms, e.completed_at
            FROM ${EvaluationRepo.TABLE_NAME} e
            JOIN ${SubmissionRepo.TABLE_NAME} s ON e.submissionId = s.id
            WHERE s.competitionId = ? AND e.round = ? AND e.status = 'EVALUATED'
            ORDER BY e.score ASC, e.inference_time_ms ASC
            LIMIT ? OFFSET ?;
        `;
        const rows = await this.db.all(query, [competitionId, round, limit, offset]);
        const data = rows.map((row: any) => this.mapToLeaderboardEntry(row));
        return { data, totalItems };
    }

    async getAllRoundResultsForUser(competitionId: number, userId: number): Promise<RoundResultForUserDto[]> {
        const query = `
            SELECT e.round, e.score, e.inference_time_ms, e.completed_at, e.status, e.error_message
            FROM ${EvaluationRepo.TABLE_NAME} e
            JOIN ${SubmissionRepo.TABLE_NAME} s ON e.submissionId = s.id
            WHERE s.competitionId = ? AND s.userId = ?
            ORDER BY e.round;
        `;
        const rows = await this.db.all(query, [competitionId, userId]);
        return rows.map((row: any) => ({
            round: row.round,
            score: row.score,
            inference_time_ms: row.inference_time_ms,
            completed_at: row.completed_at ?? null,
            status: row.status,
            error_message: row.error_message ?? null,
        }));
    }

    async getPaginatedLeaderboardForAllFinishedRounds(competitionId: number, pagination: PaginationQuery): Promise<PaginationDatabaseResult<LeaderboardEntry>> {
        const { page, limit } = pagination;
        const offset = (page - 1) * limit;
        const countQuery = `
            SELECT COUNT(DISTINCT s.id) as totalItems
            FROM ${EvaluationRepo.TABLE_NAME} e
            JOIN ${SubmissionRepo.TABLE_NAME} s ON e.submissionId = s.id
            WHERE s.competitionId = ? AND e.status = 'EVALUATED';
        `;
        const countRow = await this.db.get(countQuery, [competitionId]);
        const totalItems = countRow ? countRow.totalItems : 0;
        // Calculate the total score and total inference time for each pseudonym across all rounds. Score of each round is weighted by the round number.
        // If a evaluation entry is failed or missing, a penalty score of worst score of that round + 10% is applied
        const leaderboardQuery = `
            SELECT s.pseudonym, 
            SUM(
            CASE 
                WHEN e.status = 'EVALUATED' THEN e.score * e.round
                ELSE (SELECT MAX(score) * 1.1 FROM ${EvaluationRepo.TABLE_NAME} WHERE round = e.round AND status = 'EVALUATED') * e.round
            END
            ) as score,
            SUM(COALESCE(e.inference_time_ms, 900000)) as inference_time_ms
            FROM ${EvaluationRepo.TABLE_NAME} e
            LEFT JOIN ${SubmissionRepo.TABLE_NAME} s ON e.submissionId = s.id
            WHERE s.competitionId = ?
            GROUP BY s.id, s.pseudonym
            ORDER BY score ASC, inference_time_ms ASC
            LIMIT ? OFFSET ?;
        `;
        const rows = await this.db.all(leaderboardQuery, [competitionId, limit, offset]);
        const data = rows.map((row: any) => this.mapToLeaderboardEntry(row));
        return { data, totalItems };
    }


    async getEvaluatedRounds(competitionId: number): Promise<number[]> {
        const query = `
            SELECT DISTINCT e.round
            FROM ${EvaluationRepo.TABLE_NAME} e
            JOIN ${SubmissionRepo.TABLE_NAME} s ON e.submissionId = s.id
            WHERE s.competitionId = ? AND e.status = 'EVALUATED'
            ORDER BY e.round ASC;
        `;
        const rows = await this.db.all(query, [competitionId]);
        return rows.map((r: { round: number }) => r.round);
    }


    private mapToLeaderboardEntry(row: any): LeaderboardEntry {
        return {
            pseudonym: row.pseudonym,
            score: row.score,
            inference_time_ms: row.inference_time_ms,
            completed_at: row.completed_at ?? null,
        };
    }
}