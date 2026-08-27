import { Router } from "express";
import { CompetitionService } from "../services/competition.service";
import { CompetitionRepo } from "../repositories/competition.repository";
import { CompetitionController } from "../boundary/competition.controller";
import { Database } from "sqlite";
import { AuthentificationRepo } from "../repositories/authentification.repository";
import { requireAdmin, requireAuth, requireCourseMember } from "../middleware/auth.middleware";

export function createCompetitionRouter(db: Database): Router {
  const competitionRouter = Router();
  const repo = new CompetitionRepo(db);
  const authRepo = new AuthentificationRepo(db);
  const service = new CompetitionService(repo);
  const controller = new CompetitionController(service);

  competitionRouter.get(
    "/",
    requireAuth(authRepo), //TODO : should only admin be able to see all competitions, normal users should probably only see competitions of their courses. Or does this endpoint only return competitions of the courses the user is in? 
    controller.getAllCompetitions.bind(controller),
  );
  competitionRouter.get(
    "/:id",
    requireAuth(authRepo),
    requireCourseMember(repo, authRepo),
    controller.getCompetitionById.bind(controller),
  );
  competitionRouter.post(
    "/",
    requireAuth(authRepo),
    requireAdmin(),
    controller.createCompetition.bind(controller),
  );

  return competitionRouter;
}
