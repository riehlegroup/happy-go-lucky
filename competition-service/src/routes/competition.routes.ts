import { Router } from "express";
import { CompetitionService } from "../services/competition.service";
import { CompetitionRepo } from "../repositories/competition.repository";
import { CompetitionController } from "../boundary/competition.controller";
import { Database } from "sqlite";
import { AuthentificationRepo } from "../repositories/authentification.repository";
import { requireAdmin, requireAuth, requireCompetitionExists, requireCourseMember } from "../middleware/auth.middleware";
import { createUploader} from "../middleware/upload.middleware";
import { DatasetRepo } from "../repositories/dataset.repository";
import { DatasetService } from "../services/dataset.service";
import { DatasetController } from "../boundary/dataset.controller";

import { SubmissionRepo } from "../repositories/submission.repository";
import { SubmissionService } from "../services/submission.service";
import { SubmissionController } from "../boundary/submission.controller";

export function createCompetitionRouter(db: Database): Router {
  
  const competitionRouter = Router();
  // instances for competition service, repo and controller
  const repo = new CompetitionRepo(db);
  const authRepo = new AuthentificationRepo(db);
  const service = new CompetitionService(repo);
  const controller = new CompetitionController(service);

  // Dataset upload controller and service
  const datasetRepo = new DatasetRepo(db);
  const datasetService = new DatasetService(datasetRepo); 
  const datasetController = new DatasetController(datasetService);

  const datasetUploader = createUploader();

  // instanes for submission service, repo and controller
  const submissionRepo = new SubmissionRepo(db);
  const submissionService = new SubmissionService(submissionRepo);
  const submissionController = new SubmissionController(submissionService);

  competitionRouter.get(
    "/",
    requireAuth(authRepo), 
    requireAdmin(),
    controller.getAllCompetitions.bind(controller),
  );
  competitionRouter.get(
    "/:id",
    requireAuth(authRepo),
    requireCompetitionExists(service),
    requireCourseMember(authRepo),
    controller.getCompetitionById.bind(controller),
  );
  competitionRouter.post(
    "/",
    requireAuth(authRepo),
    requireAdmin(),
    controller.createCompetition.bind(controller),
  );
  competitionRouter.get(
    "/course/:courseId",
    requireAuth(authRepo),
    requireCourseMember(authRepo), 
    controller.getCompetitionByCourseId.bind(controller),
  );

  competitionRouter.put(
    "/:id/submissions",
    requireAuth(authRepo),
    requireCompetitionExists(service),
    requireCourseMember(authRepo),
    submissionController.createOrUpdateCompetitionSubmission.bind(submissionController),
  );

  competitionRouter.get(
    "/:id/submissions/me",
    requireAuth(authRepo),
    requireCompetitionExists(service),
    requireCourseMember(authRepo),
    submissionController.getMyCompetitionSubmission.bind(submissionController),
  );

  competitionRouter.post(
    "/:id/datasets",
    requireAuth(authRepo),
    requireCompetitionExists(service),
    requireAdmin(),
    datasetUploader.single("dataset"),
    datasetController.uploadDataset.bind(datasetController),
    
  );

  competitionRouter.get(
    "/:id/datasets",
    requireAuth(authRepo),
    requireCompetitionExists(service),
    requireCourseMember(authRepo),
    datasetController.getDatasetsForCompetition.bind(datasetController),
  );

  competitionRouter.put(
    "/:id/submissions",
    requireAuth(authRepo),
    requireCompetitionExists(service),
    requireCourseMember(authRepo),
    submissionController.createOrUpdateCompetitionSubmission.bind(submissionController),
  );

  competitionRouter.get(
    "/:id/submissions/me",
    requireAuth(authRepo),
    requireCompetitionExists(service),
    requireCourseMember(authRepo),
    submissionController.getMyCompetitionSubmission.bind(submissionController),
  );

  return competitionRouter;
}
