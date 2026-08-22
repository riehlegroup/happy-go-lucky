import { Router } from "express";
import { createCompetitionRouter } from "./competition.routes";
import { Database } from "sqlite";

export function createApiRouter(db: Database): Router {
  const apiRouter = Router();

  // Wir rufen die Factory-Funktion auf und geben die db weiter
  apiRouter.use("/competitions", createCompetitionRouter(db));
  

  return apiRouter;
}
