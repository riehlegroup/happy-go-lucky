import { EvaluationService } from "../services/evaluation.service";
import { errorResponse, handleError } from "../errors/errorhandling.helper";
import { DatasetType, datasetTypeSchema } from "../types/competition.types";

export class EvaluationController {
	private evaluationService: EvaluationService;

	constructor(evaluationService: EvaluationService) {
		this.evaluationService = evaluationService;
	}

	async startEvaluationForCompetition(req: any, res: any) {
		try {
			const competition = req.competition;
			if (!competition) {
				return errorResponse("Competition not found in request", 400, res);
			}
			const datasetType = req.query.datasetType as DatasetType | undefined;
			if (!datasetType) {
				return errorResponse("Dataset type is required", 400, res);
			}
			if (datasetType !== DatasetType.TEST && datasetType !== DatasetType.VALIDATION) {
				return errorResponse("Invalid dataset type. Must be 'TEST' or 'VALIDATION'", 400, res);
			}

			// Call the service to start the evaluation for the competition asynchronously
			await this.evaluationService.startEvaluation(competition, datasetType);

			res.status(200).json({ message: "Evaluation started successfully" });
		} catch (error) {
			handleError(error, "Failed to start evaluation for competition", res);
		}
	}

    async downloadInputCsv(req: any, res: any) {
        try {
            const token = req.query.token as string | undefined;
            if (!token) {
                return errorResponse("Token is required", 400, res);
            }

            throw new Error("Not implemented yet");

        } catch (error) {
            handleError(error, "Failed to download input CSV", res);
        }
    }

    async uploadStudentPrediction(req: any, res: any) {
        try {
            const token = req.query.token as string | undefined;
            if (!token) {
                return errorResponse("Token is required", 400, res);
            }

            throw new Error("Not implemented yet");

        } catch (error) {
            handleError(error, "Failed to upload student predictions", res);
        }
    }

}
