import { Application } from "express";
import { Database } from "sqlite";

/**
 * Interface for all application controllers.
 * Ensures consistent structure across all controllers in the application.
 */
export interface AppController {
  /**
   * Initializes API routes for this controller.
   * Called during application startup to register all routes with the Express app.
   *
   * @param app Express application instance
   */
  init(app: Application): void;
}

/**
 * Constructor signature for controllers.
 * All controllers must accept a Database instance in their constructor.
 */
export interface AppControllerConstructor {
  new (db: Database): AppController;
}
