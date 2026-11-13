import { Router } from "express";
import { Database } from "sqlite";
import { EvaluationRepo } from "../repositories/evaluation.repository";
import { EvaluationService } from "../services/evaluation.service";
import { EvaluationController } from "../boundary/evaluation.controller";
import { CompetitionRepo } from "../repositories/competition.repository";
import { SubmissionRepo } from "../repositories/submission.repository";
import { DatasetRepo } from "../repositories/dataset.repository";
import { AuthentificationRepo } from "../repositories/authentification.repository";
import { requireAdmin, requireAuth, requireCompetitionExists, requireInternalSecret } from "../middleware/auth.middleware";
import { CompetitionService } from "../services/competition.service";
import { DatasetUploadMiddleware } from "../middleware/upload.middleware";
import { DatasetRoundCache } from "../services/datasetround.cache";

export function createEvaluationRouter(
	authRepo: AuthentificationRepo,
	competitionService: CompetitionService,
	datasetRepo: DatasetRepo,
	submissionRepo: SubmissionRepo,
	evaluationRepo: EvaluationRepo,
	datasetUploader: DatasetUploadMiddleware,
	datasetRoundCache: DatasetRoundCache
): Router {
	const evaluationRouter = Router();

	const evaluationService = new EvaluationService(datasetRepo, submissionRepo, evaluationRepo, datasetRoundCache);

	const evaluationController = new EvaluationController(evaluationService);

	const receivedAtMiddleware = (req: any, res: any, next: any) => {
		req.receivedAt = Date.now();
		next();
	}; 
	
	evaluationRouter.post(
		"/competitions/:id/start",
		requireAuth(authRepo),
		requireCompetitionExists(competitionService),
		requireAdmin(),
		evaluationController.startEvaluationForCompetition.bind(evaluationController),
	);
	evaluationRouter.post(
		"/courses/:courseId/start",
		requireInternalSecret(),
		requireCompetitionExists(competitionService),
		evaluationController.startEvaluationForCourse.bind(evaluationController));

	evaluationRouter.get("/:token/download", evaluationController.downloadInputCsv.bind(evaluationController));
	
	evaluationRouter.post("/:token/upload",
		receivedAtMiddleware,
		datasetUploader.singleStudentPrediction("predictions"),
		evaluationController.uploadStudentPrediction.bind(evaluationController),
	);

	return evaluationRouter;
}
