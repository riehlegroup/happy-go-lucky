import { Router } from "express";
import { CompetitionService } from "../services/competition.service";
import { CompetitionRepo } from "../repositories/competition.repository";
import { CompetitionController } from "../boundary/competition.controller";
import { Database } from "sqlite";
import { AuthentificationRepo } from "../repositories/authentification.repository";
import { requireAdmin, requireAuth, requireCourseMember } from "../middleware/auth.middleware";
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

  // instanes for submission service, repo and controller
  const submissionRepo = new SubmissionRepo(db);
  const submissionService = new SubmissionService(submissionRepo);
  const submissionController = new SubmissionController(submissionService);

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
  competitionRouter.get(
    "/course/:courseId",
    requireAuth(authRepo),
    requireCourseMember(repo, authRepo),
    controller.getCompetitionByCourseId.bind(controller),
  );

  competitionRouter.put(
    "/:id/submissions",
    requireAuth(authRepo),
    requireCourseMember(repo, authRepo),
    submissionController.createOrUpdateCompetitionSubmission.bind(submissionController),
  );

  competitionRouter.get(
    "/:id/submissions/me",
    requireAuth(authRepo),
    requireCourseMember(repo, authRepo),
    submissionController.getMyCompetitionSubmission.bind(submissionController),
  );

  return competitionRouter;
}
