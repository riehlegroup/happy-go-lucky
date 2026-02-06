import { Application, Request, Response } from "express";
import { Database } from "sqlite";
import { DatabaseHelpers } from "../Models/DatabaseHelpers";
import { AppController } from "./AppController";

/**
 * Controller for handling legacy HTTP endpoints.
 * Maps old API routes to new functionality for backward compatibility.
 */
export class LegacyController implements AppController {
  constructor(private db: Database) {}

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
      res.status(400).json({ message: "Please fill in URL!" });
      return;
    } else if (!URL.includes("git")) {
      res.status(400).json({ message: "Invalid URL" });
      return;
    }

    try {
      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail);
      const projectId = await DatabaseHelpers.getProjectIdFromName(this.db, projectName);

      await this.db.run(
        `UPDATE user_projects SET url = ? WHERE userId = ? AND projectId = ?`,
        [URL, userId, projectId]
      );
      res.status(200).json({ message: "URL added successfully" });
    } catch (error) {
      console.error("Error adding URL:", error);
      res.status(500).json({ message: "Failed to add URL", error });
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
          res.status(404).json({ message: "Project not found" });
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
        res.status(400).json({ message: "You are not a member of this project" });
        return;
      }
      await this.db.run("DELETE FROM user_projects WHERE userId = ? AND projectId = ?", [
        userId,
        projectId,
      ]);

      res.status(200).json({ message: "Left project successfully" });
    } catch (error) {
      console.error("Error during leaving project:", error);
      res.status(500).json({ message: "Failed to leave project", error });
    }
  }
}
