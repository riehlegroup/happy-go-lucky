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
		try {
            //TODO: health check for the apiUrl before saving?
			const result = await this.submissionRepo.upsertSubmission(
				competitionId,
				userId,
				submission.apiUrl,
				submission.pseudonym,
			);
			return result;
		} catch (error: any) {
			if (error?.message?.includes("UNIQUE constraint failed") || error?.code === "SQLITE_CONSTRAINT") {
				if (error?.message?.includes("pseudonym")) {
					throw new BadRequestException("Pseudonym is already in use");
				}
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