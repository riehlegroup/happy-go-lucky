import { Application, Request, Response } from "express";
import { Database } from "sqlite";
import { DatabaseHelpers } from "../Models/DatabaseHelpers";
import { IAppController } from "./IAppController";
import { II18nService, msgKey } from "../Services/I18nService";

/**
 * Controller for handling legacy HTTP endpoints.
 * Maps old API routes to new functionality for backward compatibility.
 */
export class LegacyController implements IAppController {
  constructor(private db: Database, private i18n: II18nService) {}

  /**
   * Initializes legacy API routes.
   * @param app Express application instance
   */
  init(app: Application): void {
    app.post("/projConfig/changeURL", this.setUserProjectURL.bind(this));
    app.post("/projConfig/leaveProject", this.leaveProject.bind(this));
  }

  async setUserProjectURL(req: Request, res: Response): Promise<void> {
    const { userEmail, URL, projectName } = req.body;

    if (!URL) {
      res.status(400).json({ message: this.i18n.translate(req, msgKey.common.pleaseFillInUrl) });
      return;
    } else if (!URL.includes("git")) {
      res.status(400).json({ message: this.i18n.translate(req, msgKey.common.invalidUrl) });
      return;
    }

    try {
      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail);
      const projectId = await DatabaseHelpers.getProjectIdFromName(this.db, projectName);

      await this.db.run(
        `UPDATE user_projects SET url = ? WHERE userId = ? AND projectId = ?`,
        [URL, userId, projectId]
      );
      res.status(200).json({ message: this.i18n.translate(req, msgKey.common.urlAddedSuccessfully) });
    } catch (error) {
      console.error("Error adding URL:", error);
      res.status(500).json({ message: this.i18n.translate(req, msgKey.common.failedToAddUrl), error });
    }
  }

  async leaveProject(req: Request, res: Response): Promise<void> {
    const { userEmail, projectName } = req.body;

    try {
      let projectId;
      try {
        projectId = await DatabaseHelpers.getProjectIdFromName(this.db, projectName);
      } catch (error) {
        if (error instanceof Error && error.message.includes("Unknown Course Name!")) {
          res.status(404).json({ message: this.i18n.translate(req, msgKey.common.projectNotFound) });
          return;
        }
        throw error;
      }

      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail);
      const isMember = await this.db.get(
        `SELECT * FROM user_projects WHERE userId = ? AND projectId = ?`,
        [userId, projectId]
      );
      if (!isMember) {
        res.status(400).json({ message: this.i18n.translate(req, msgKey.common.notMemberOfProject) });
        return;
      }
      await this.db.run("DELETE FROM user_projects WHERE userId = ? AND projectId = ?", [
        userId,
        projectId,
      ]);

      res.status(200).json({ message: this.i18n.translate(req, msgKey.common.leftProjectSuccessfully) });
    } catch (error) {
      console.error("Error during leaving project:", error);
      res.status(500).json({ message: this.i18n.translate(req, msgKey.common.failedToLeaveProject), error });
    }
  }
}
