import { Router } from "express";
import { createCompetitionRouter } from "./competition.routes";
import { Database } from "sqlite";

export function createApiRouter(db: Database): Router {
  const apiRouter = Router();

  apiRouter.use("/competitions", createCompetitionRouter(db));
  
  return apiRouter;
}
