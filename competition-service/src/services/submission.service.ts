import { SubmissionRepo } from "../repositories/submission.repository";
import { Submission, SubmissionInboundDto } from "../types/competition.types";

export class SubmissionService {
    constructor(private submissionRepo: SubmissionRepo) {}

    async createOrUpdateCompetitionSubmission(submission: SubmissionInboundDto): Promise<Submission> {
       //TODO: health check for the apiUrl before saving?
        return await this.submissionRepo.upsertSubmission(submission.competitionId, submission.userId, submission.apiUrl);
    }

    async getMyCompetitionSubmission(competitionId: number, userId: number): Promise<Submission | null> {
        return await this.submissionRepo.getSubmissionByCompetitionAndUser(competitionId, userId);
    }
}