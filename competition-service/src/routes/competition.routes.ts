import { Router } from "express";
import { CompetitionService } from "../services/competition.service";
import { CompetitionRepo } from "../repositories/competition.repository";
import { CompetitionController } from "../boundary/competition.controller";
import { Database } from "sqlite";
import { AuthentificationRepo } from "../repositories/authentification.repository";
import {
	requireAdmin,
	requireAuth,
	requireCompetitionActive,
	requireCompetitionExists,
	requireCourseMember,
} from "../middleware/auth.middleware";

import { DatasetRepo } from "../repositories/dataset.repository";
import { DatasetService } from "../services/dataset.service";
import { DatasetController } from "../boundary/dataset.controller";
import { SubmissionRepo } from "../repositories/submission.repository";
import { SubmissionService } from "../services/submission.service";
import { SubmissionController } from "../boundary/submission.controller";
import { DatasetUploadMiddleware } from "../middleware/upload.middleware";

export function createCompetitionRouter(
	authRepo: AuthentificationRepo,
	datasetRepo: DatasetRepo,
	submissionRepo: SubmissionRepo,
	competitionService: CompetitionService,
	datasetUploader: DatasetUploadMiddleware,
): Router {
	const competitionRouter = Router();
	// instances for competition service and controller
	const controller = new CompetitionController(competitionService);

	// Dataset upload controller and service

	const datasetService = new DatasetService(datasetRepo);
	const datasetController = new DatasetController(datasetService);

	// instanes for submission service, repo and controller

	const submissionService = new SubmissionService(submissionRepo);
	const submissionController = new SubmissionController(submissionService);

	competitionRouter.get("/", requireAuth(authRepo), requireAdmin(), controller.getAllCompetitions.bind(controller));
	competitionRouter.get(
		"/:id",
		requireAuth(authRepo),
		requireCompetitionExists(competitionService),
		requireCourseMember(authRepo),
		requireCompetitionActive(),
		controller.getCompetitionById.bind(controller),
	);
	competitionRouter.post("/", requireAuth(authRepo), requireAdmin(), controller.createCompetition.bind(controller));
	competitionRouter.put("/:id", requireAuth(authRepo), requireAdmin(), controller.updateCompetition.bind(controller));
	competitionRouter.get(
		"/course/:courseId",
		requireAuth(authRepo),
		requireCompetitionExists(competitionService),
		requireCourseMember(authRepo),
		requireCompetitionActive(),
		controller.getCompetitionByCourseId.bind(controller),
	);

	competitionRouter.put(
		"/:id/submissions",
		requireAuth(authRepo),
		requireCompetitionExists(competitionService),
		requireCourseMember(authRepo),
		requireCompetitionActive(),
		submissionController.createOrUpdateCompetitionSubmission.bind(submissionController),
	);

	competitionRouter.get(
		"/:id/submissions/me",
		requireAuth(authRepo),
		requireCompetitionExists(competitionService),
		requireCourseMember(authRepo),
		requireCompetitionActive(),
		submissionController.getMyCompetitionSubmission.bind(submissionController),
	);

	competitionRouter.post(
		"/:id/datasets/train",
		requireAuth(authRepo),
		requireCompetitionExists(competitionService),
		requireAdmin(),
		datasetUploader.single("dataset"),
		datasetController.uploadTrainingDataset.bind(datasetController),
	);

	competitionRouter.post(
		"/:id/datasets",
		requireAuth(authRepo),
		requireCompetitionExists(competitionService),
		requireAdmin(),
		datasetUploader.fields([
			{ name: "inputFile", maxCount: 1 },
			{ name: "groundTruthFile", maxCount: 1 },
		]),
		datasetController.uploadDatasetsForCompetitionRound.bind(datasetController),
	);

	competitionRouter.get(
		"/:id/datasets/download",
		requireAuth(authRepo),
		requireCompetitionExists(competitionService),
		requireCourseMember(authRepo),
		requireCompetitionActive(),
		datasetController.downloadDatasetsForCompetition.bind(datasetController),
	);

	competitionRouter.get(
		"/:id/datasets",
		requireAuth(authRepo),
		requireCompetitionExists(competitionService),
		requireCourseMember(authRepo),
		requireCompetitionActive(),
		datasetController.getDatasetsMetadataForCompetition.bind(datasetController),
	);

	competitionRouter.delete(
		"/:id/datasets/:datasetId",
		requireAuth(authRepo),
		requireCompetitionExists(competitionService),
		requireAdmin(),
		datasetController.deleteDataset.bind(datasetController),
	);

	return competitionRouter;
}
