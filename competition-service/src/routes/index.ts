import { Router } from "express";
import { createCompetitionRouter } from "./competition.routes";
import { Database } from "sqlite";
import { createEvaluationRouter } from "./evaluation.routes";
import { CompetitionRepo } from "../repositories/competition.repository";
import { AuthentificationRepo } from "../repositories/authentification.repository";
import { EvaluationConfigRepo } from "../repositories/evaluationConfig.repository";
import { DatasetRepo } from "../repositories/dataset.repository";
import { SubmissionRepo } from "../repositories/submission.repository";
import { EvaluationRepo } from "../repositories/evaluation.repository";
import { CompetitionService } from "../services/competition.service";

export function createApiRouter(db: Database): Router {
  const apiRouter = Router();

  const competitionRepo = new CompetitionRepo(db);
  const authRepo = new AuthentificationRepo(db);
  const evaluationConfigRepo = new EvaluationConfigRepo(db);
  const datasetRepo = new DatasetRepo(db); 
  const submissionRepo = new SubmissionRepo(db);
  const evaluationRepo = new EvaluationRepo(db);

  const competitionService = new CompetitionService(competitionRepo);

  apiRouter.use("/competitions", createCompetitionRouter(db, authRepo, competitionRepo, datasetRepo, evaluationConfigRepo, submissionRepo, competitionService));
  apiRouter.use("/evaluations", createEvaluationRouter(db, authRepo, evaluationConfigRepo, datasetRepo, submissionRepo, competitionRepo, evaluationRepo, competitionService));
  
  return apiRouter;
}
