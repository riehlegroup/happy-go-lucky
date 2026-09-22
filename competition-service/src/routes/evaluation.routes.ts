import { Router } from "express";
import { Database } from "sqlite";
import { EvaluationRepo } from "../repositories/evaluation.repository";
import { EvaluationService } from "../services/evaluation.service";
import { EvaluationController } from "../boundary/evaluation.controller";
import { CompetitionRepo } from "../repositories/competition.repository";
import { SubmissionRepo } from "../repositories/submission.repository";
import { DatasetRepo } from "../repositories/dataset.repository";
import { EvaluationConfigRepo } from "../repositories/evaluationConfig.repository";
import { AuthentificationRepo } from "../repositories/authentification.repository";
import { requireAdmin, requireAuth, requireCompetitionExists } from "../middleware/auth.middleware";
import { CompetitionService } from "../services/competition.service";

export function createEvaluationRouter(
	db: Database,
	authRepo: AuthentificationRepo,
	evaluationConfigRepo: EvaluationConfigRepo,
	datasetRepo: DatasetRepo,
	submissionRepo: SubmissionRepo,
	competitionRepo: CompetitionRepo,
	evaluationRepo: EvaluationRepo,
	competitionService: CompetitionService,
): Router {
	const evaluationRouter = Router();

	const evaluationService = new EvaluationService(
		evaluationConfigRepo,
		datasetRepo,
		submissionRepo,
		competitionRepo,
		evaluationRepo,
	);
	const evaluationController = new EvaluationController(evaluationService);

	evaluationRouter.post(
		"/competitons/:id/start",
		requireAuth(authRepo),
		requireCompetitionExists(competitionService),
		requireAdmin(),
		evaluationController.startEvaluationForCompetition.bind(evaluationController),
	);

	evaluationRouter.get("/:token/download", evaluationController.downloadInputCsv.bind(evaluationController));
	evaluationRouter.post("/:token/upload", evaluationController.uploadStudentPrediction.bind(evaluationController));

	return evaluationRouter;
}
