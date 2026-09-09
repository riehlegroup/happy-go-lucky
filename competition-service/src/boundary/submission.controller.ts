import { SubmissionService } from "../services/submission.service";
import { Submission, SubmissionInboundDto, SubmissionInboundDtoSchema } from "../types/competition.types";
import { Request, Response } from "express";

/**
 * SubmissionController is responsible for handling HTTP requests related to competition submissions. It is seperated from the CompetitionController to keep small and focused controllers. 
 */
export class SubmissionController {
    constructor(private submissionService: SubmissionService) {};   

    async createOrUpdateCompetitionSubmission(req: Request, res: Response) {
        try {
            // validate the request body using Zod schema
            const submissionData: SubmissionInboundDto = SubmissionInboundDtoSchema.parse(req.body);
            const submission: Submission = await this.submissionService.createOrUpdateCompetitionSubmission(submissionData);
            res.status(200).json({ success: true, data: submission });
        } catch (error) {
            //TODO: handle error if other branch is merged 
        }
    }

    async getMyCompetitionSubmission(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(400).json({ message: "User ID not found in request" });
            }
            const competitionId = Number(req.params.id);
            if (isNaN(competitionId)) {
                return res.status(400).json({ message: "Invalid competition ID" });
            }

            const submission: Submission | null = await this.submissionService.getMyCompetitionSubmission(competitionId, userId);
            if (submission) {
                res.status(200).json({ success: true, data: submission });
            } else {
                res.status(404).json({ success: false, message: "No Submission found for logged-in user" });
            }
        } catch (error) {
            //TODO: handle error if other branch is merged 
        }
    }

}