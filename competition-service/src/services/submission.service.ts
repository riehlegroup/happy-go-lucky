import { SubmissionRepo } from "../repositories/submission.repository";
import { Submission, SubmissionInboundDto } from "../types/competition.types";

export class SubmissionService {
    constructor(private submissionRepo: SubmissionRepo) {}

    async createOrUpdateCompetitionSubmission(submission: SubmissionInboundDto, competitionId: number, userId: number): Promise<Submission> {
       //TODO: health check for the apiUrl before saving -> implement after endpoint definition for health check is done
        return await this.submissionRepo.upsertSubmission(competitionId, userId, submission.apiUrl);
    }

    async getMyCompetitionSubmission(competitionId: number, userId: number): Promise<Submission | null> {
        return await this.submissionRepo.getSubmissionByCompetitionAndUser(competitionId, userId);
    }
}