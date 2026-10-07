import { EvaluationService } from "../services/evaluation.service";
import { errorResponse, handleError } from "../errors/errorhandling.helper";
import { EvaluationStatus } from "../types/competition.types";

import fs from "fs";

export class EvaluationController {
	private evaluationService: EvaluationService;

	constructor(evaluationService: EvaluationService) {
		this.evaluationService = evaluationService;
	}

	async startEvaluationForCourse(req: any, res: any) {
		try {
			const courseId = Number(req.params.courseId);
			if (isNaN(courseId) || courseId < 0) {
				return errorResponse("Invalid course ID", 400, res);
			}
			const round = Number(req.query.round);
			if (isNaN(round) || round < 1) {
				return errorResponse("Invalid round number", 400, res);
			}
			
			const competition = req.competition;
			if (!competition) {
				return errorResponse("No information about the competition in request", 400, res);
			}

			await this.evaluationService.startEvaluation(competition, round);

			res.status(200).json({ message: "Evaluation started successfully" });
		} catch (error) {
			handleError(error, "Failed to start evaluation for course", res);
		}
	}

	async startEvaluationForCompetition(req: any, res: any) {
		try {
			const competition = req.competition;
			const round = Number(req.query.round);
			if (!competition) {
				return errorResponse("Competition not found in request", 400, res);
			}
			if (isNaN(round) || round < 1) {
				return errorResponse("Invalid round number", 400, res);
			}

			await this.evaluationService.startEvaluation(competition, round);

			res.status(200).json({ message: "Evaluation started successfully" });
		} catch (error) {
			handleError(error, "Failed to start evaluation for competition", res);
		}
	}

	async downloadInputCsv(req: any, res: any) {
		try {
			const token = (req.params.token || req.query.token) as string | undefined;
			if (!token) {
				return errorResponse("Token is required", 400, res);
			}

			const evaluation = await this.evaluationService.requireEvaluationEntryExists(token, EvaluationStatus.PENDING);
			const inputFilePath = await this.evaluationService.getInputDatasetFilePathForCompetiitionAndRound(
				evaluation.competitionId,
				evaluation.round,
			);

			if (!fs.existsSync(inputFilePath)) {
				return errorResponse(`Input dataset file not found on disk`, 500, res);
			}
			if (!evaluation.started_at) {
				await this.evaluationService.updateEvaluation(evaluation.id, { started_at: new Date() });
			}

			res.setHeader("Content-Type", "text/csv");
			res.setHeader("Content-Disposition", `attachment; filename="test_dataset.csv"`);

			return res.download(inputFilePath, "input_dataset.csv", (err: any) => {
				if (err && !res.headersSent) {
					console.error(`Error downloading input CSV: ${err}`);
					handleError(err, "Failed to download input CSV", res);
				}
			});
		} catch (error) {
			handleError(error, "Failed to download input CSV", res);
		}
	}

	async uploadStudentPrediction(req: any, res: any) {
		try {
			const receivedAt = Date.now(); // for more precise timing received at can be added to request with middleware
			const token = (req.params.token || req.query.token) as string | undefined;
			if (!token) {
				return errorResponse("Token is required", 400, res);
			}

			//Check if file is present
			if (!req.file) {
				return errorResponse("No file uploaded", 400, res);
			}

			const evaluation = await this.evaluationService.requireEvaluationEntryExists(token, EvaluationStatus.PENDING);

			const csvString = req.file.buffer.toString("utf-8");

			const result = await this.evaluationService.evaluateStudentPrediction(evaluation.competitionId, evaluation, csvString, receivedAt);

			return res.status(200).json({
				status: result.status,
				score: result.score,
			});
		} catch (error) {
			handleError(error, "Failed to upload student predictions", res);
		}
	}
}
