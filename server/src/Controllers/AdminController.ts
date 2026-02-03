import { Application, Request, Response } from "express";
import { Database } from "sqlite";
import { IAppController } from "./IAppController";
import { checkAdmin } from "../Middleware/checkAdmin";

/**
 * Administrative controller.
 *
 * Currently provides a graceful shutdown endpoint that:
 * - marks the app as "shutting down" (so new requests get rejected)
 * - triggers the configured shutdown handler (server close + DB close)
 */
export class AdminController implements IAppController {
  constructor(private db: Database) {}

  init(app: Application): void {
    app.post("/admin/shutdown", checkAdmin(this.db), this.shutdown.bind(this));
  }

  async shutdown(req: Request, res: Response): Promise<void> {
    const app = req.app;

    if (app.locals.isShuttingDown) {
      res.status(200).json({ success: true, message: "Shutdown already in progress" });
      return;
    }

    app.locals.isShuttingDown = true;

    // Respond first, then shut down asynchronously.
    res.status(202).json({ success: true, message: "Shutdown initiated" });

    const shutdownHandler = app.locals.shutdownHandler;
    if (typeof shutdownHandler === "function") {
      setImmediate(() => {
        Promise.resolve(shutdownHandler()).catch((error: unknown) => {
          console.error("Shutdown handler failed:", error);
        });
      });
    }
  }
}
