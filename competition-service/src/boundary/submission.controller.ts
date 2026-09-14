import { errorResponse, handleError } from "../errors/errorhandling.helper";
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
            const userId = req.user?.id;
            const competitionId = req.competition?.id; 
            if (!userId || !competitionId) {
                return errorResponse("User ID or competition ID not found in request", 400, res);
            }

            const submission: Submission = await this.submissionService.createOrUpdateCompetitionSubmission(submissionData, competitionId, userId);
            res.status(200).json(submission );
        } catch (error) {
            handleError(error, "Failed to create or update submission", res); 
        }
    }

    async getMyCompetitionSubmission(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return errorResponse("User ID not found in request", 400, res);
            }
            const competitionId = req.competition?.id;
            if (!competitionId) {
                return errorResponse("Competition ID not found in request", 400, res);
            }

            const submission: Submission | null = await this.submissionService.getMyCompetitionSubmission(competitionId, userId);
            if (submission) {
                res.status(200).json(submission );
            } else {
                return errorResponse("No Submission found for logged-in user", 404, res);
            }
        } catch (error) {
            handleError(error, "Failed to retrieve submission", res);
        }
    }

}