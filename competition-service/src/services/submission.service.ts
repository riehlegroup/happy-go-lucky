import { BadRequestException } from "../errors/badrequest.error";
import { SubmissionRepo } from "../repositories/submission.repository";
import { Submission, SubmissionInboundDto } from "../types/competition.types";

export class SubmissionService {
	constructor(private submissionRepo: SubmissionRepo) {}

	async createOrUpdateCompetitionSubmission(
		submission: SubmissionInboundDto,
		competitionId: number,
		userId: number,
	): Promise<Submission> {
	
		//Health check for provided Url to ensure it is reachable
		try {
            const healthUrl = submission.apiUrl.endsWith("/") ? `${submission.apiUrl}health` : `${submission.apiUrl}/health`;
			const healthResult: Response = await fetch(healthUrl, { method: "GET", signal: AbortSignal.timeout(5000) });
			if (!healthResult.ok) {
				throw new BadRequestException(
					`The provided apiUrl is not reachable or does not return a 200 status code on the /health endpoint. Received status: ${healthResult.status}`,
				);
			}
		} catch (error: any) {
			if (error instanceof BadRequestException) {
				throw error;
			}
			const reason = error instanceof Error ? error.message : "Connection failed";
			throw new BadRequestException(`provided API-Url is not reachable. Error: ${reason}`);
		}
		try {
			const result = await this.submissionRepo.upsertSubmission(
				competitionId,
				userId,
				submission.apiUrl,
				submission.pseudonym,
			);
			return result;
		} catch (error: any) {
			if (error?.message?.includes("UNIQUE constraint") || error?.code === "SQLITE_CONSTRAINT") {
				if (error?.message?.includes("pseudonym")) {
					throw new BadRequestException("Pseudonym is already in use");
				}
			}
			if (error instanceof BadRequestException) {
				throw error;
			}
			throw new Error(
				`Error retrieving submission for competitionId ${competitionId} and userId ${userId}: ${error.message}`,
			);
		}
	}

	async getMyCompetitionSubmission(competitionId: number, userId: number): Promise<Submission | null> {
		return await this.submissionRepo.getSubmissionByCompetitionAndUser(competitionId, userId);
	}
}
