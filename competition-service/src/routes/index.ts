import { Router } from "express";
import { createCompetitionRouter } from "./competition.routes";
import { Database } from "sqlite";
import { createEvaluationRouter } from "./evaluation.routes";
import { CompetitionRepo } from "../repositories/competition.repository";
import { AuthentificationRepo } from "../repositories/authentification.repository";
import { DatasetRepo } from "../repositories/dataset.repository";
import { SubmissionRepo } from "../repositories/submission.repository";
import { EvaluationRepo } from "../repositories/evaluation.repository";
import { CompetitionService } from "../services/competition.service";
import { createUploader } from "../middleware/upload.middleware";

export function createApiRouter(db: Database): Router {
  const apiRouter = Router();

  const competitionRepo = new CompetitionRepo(db);
  const authRepo = new AuthentificationRepo(db);
  const datasetRepo = new DatasetRepo(db); 
  const submissionRepo = new SubmissionRepo(db);
  const evaluationRepo = new EvaluationRepo(db);

  const datasetUploader = createUploader();

  const competitionService = new CompetitionService(competitionRepo);

  apiRouter.use("/competitions", createCompetitionRouter(authRepo, datasetRepo, submissionRepo, competitionService, datasetUploader));
  apiRouter.use("/evaluations", createEvaluationRouter(authRepo, competitionService, datasetRepo, submissionRepo, competitionRepo, evaluationRepo, datasetUploader));
  
  return apiRouter;
}
