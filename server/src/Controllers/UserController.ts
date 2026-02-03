import { Application, Request, Response } from "express";
import { Database } from "sqlite";
import { hashPassword } from "../Utils/hash";
import { DatabaseHelpers } from "../Models/DatabaseHelpers";
import { checkOwnership } from "../Middleware/checkOwnership";
import { IAppController } from "./IAppController";
import { IEmailService } from "../Services/IEmailService";
import { II18nService, msgKey } from "../Services/I18nService";

/**
 * Controller for handling user-related HTTP requests.
 * Manages user administration, status, and configuration (email, password, GitHub, URLs, roles).
 */
export class UserController implements IAppController {
  constructor(
    private db: Database,
    private emailService: IEmailService,
    private i18n: II18nService
  ) {}

  /**
   * Initializes API routes for user management.
   * @param app Express application instance
   */
  init(app: Application): void {
    // User administration
    app.get("/getUsers", this.getUsers.bind(this));
    app.get("/user/status", this.getUsersByStatus.bind(this));
    app.post(
      "/user/status",
      checkOwnership(this.db, this.i18n),
      this.updateUserStatus.bind(this)
    );
    app.post("/user/status/all", this.updateAllConfirmedUsers.bind(this));

    // User configuration
    app.post("/user/mail", this.changeEmail.bind(this));
    app.post("/user/password/change", this.changePassword.bind(this));
    app.post("/user/githubUsername", this.setUserGitHubUsername.bind(this));
    app.get("/user/githubUsername", this.getUserGitHubUsername.bind(this));
    app.post("/user/project/url", this.setUserProjectURL.bind(this));
    app.get("/user/project/url", this.getUserProjectURL.bind(this));
    app.get("/user/role", this.getUserRole.bind(this));
    app.post("/user/role", this.updateUserRole.bind(this));
  }

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.db.all("SELECT * FROM users");
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: this.i18n.translate(req, msgKey.common.userNotFound) });
      }
    } catch (error) {
      console.error("Error during retrieving user status:", error);
      res
        .status(500)
        .json({ message: this.i18n.translate(req, msgKey.user.failedToRetrieveUserStatus), error });
    }
  }

  async getUsersByStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.query;

    try {
      const users = await this.db.all("SELECT * FROM users WHERE status = ?", [status]);
      res.json(users);
    } catch (error) {
      console.error("Error during retrieving user status:", error);
      res
        .status(500)
        .json({ message: this.i18n.translate(req, msgKey.user.failedToRetrieveUserStatus), error });
    }
  }

  async updateUserStatus(req: Request, res: Response): Promise<void> {
    const { userEmail, status } = req.body;

    if (!userEmail || !status) {
      res.status(400).json({ message: this.i18n.translate(req, msgKey.user.provideEmailAndStatus) });
      return;
    }

    if (status == "suspended") {
      await this.sendSuspendedEmail(userEmail);
    } else if (status == "removed") {
      await this.sendRemovedEmail(userEmail);
    }

    try {
      await this.db.run("UPDATE users SET status = ? WHERE email = ?", [status, userEmail]);
      res
        .status(200)
        .json({ message: this.i18n.translate(req, msgKey.user.userStatusUpdatedSuccessfully) });
    } catch (error) {
      console.error("Error during updating user status:", error);
      res
        .status(500)
        .json({ message: this.i18n.translate(req, msgKey.user.failedToUpdateUserStatus), error });
    }
  }

  async updateAllConfirmedUsers(req: Request, res: Response): Promise<void> {
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ message: this.i18n.translate(req, msgKey.user.statusIsRequired) });
      return;
    }

    try {
      const result = await this.db.run(
        'UPDATE users SET status = ? WHERE status = "confirmed"',
        [status]
      );

      const changes = result.changes ?? 0;

      if (changes === 0) {
        res
          .status(404)
          .json({ message: this.i18n.translate(req, msgKey.user.noConfirmedUsersFoundToUpdate) });
        return;
      }

      res
        .status(200)
        .json({ message: this.i18n.translate(req, msgKey.user.allConfirmedUsersUpdatedTo, status) });
    } catch (error) {
      console.error("Error updating confirmed users:", error);
      res.status(500).json({ message: this.i18n.translate(req, msgKey.user.failedToUpdateConfirmedUsers) });
    }
  }

  async changeEmail(req: Request, res: Response): Promise<void> {
    const { newEmail, oldEmail } = req.body;
    if (!newEmail) {
      res.status(400).json({ message: this.i18n.translate(req, msgKey.user.fillInNewEmail) });
      return;
    } else if (!newEmail.includes("@")) {
      res.status(400).json({ message: this.i18n.translate(req, msgKey.user.invalidEmailAddress) });
      return;
    }

    try {
      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, oldEmail);
      await this.db.run(`UPDATE users SET email = ? WHERE id = ?`, [newEmail, userId]);
      res.status(200).json({ message: this.i18n.translate(req, msgKey.user.emailUpdatedSuccessfully) });
    } catch (error) {
      console.error("Error updating email:", error);
      res.status(500).json({ message: this.i18n.translate(req, msgKey.user.failedToUpdateEmail), error });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    const { userEmail, password } = req.body;

    if (!password) {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.user.fillInNewPassword) });
      return;
    } else if (password.length < 8) {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.user.passwordMinLength8) });
      return;
    }

    const hashedPassword = await hashPassword(password);

    try {
      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail);
      await this.db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, userId]);
      res
        .status(200)
        .json({ message: this.i18n.translate(req, msgKey.user.passwordUpdatedSuccessfully) });
    } catch (error) {
      console.error("Error updating password:", error);
      res
        .status(500)
        .json({ message: this.i18n.translate(req, msgKey.user.failedToUpdatePassword), error });
    }
  }

  async setUserProjectURL(req: Request, res: Response): Promise<void> {
    const { userEmail, URL, projectName } = req.body;

    if (!URL) {
      res.status(400).json({ message: this.i18n.translate(req, msgKey.user.fillInUrl) });
      return;
    } else if (!URL.includes("git")) {
      res.status(400).json({ message: this.i18n.translate(req, msgKey.user.invalidUrl) });
      return;
    }

    try {
      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail);
      const projectId = await DatabaseHelpers.getProjectIdFromName(this.db, projectName);

      await this.db.run(
        `UPDATE user_projects SET url = ? WHERE userId = ? AND projectId = ?`,
        [URL, userId, projectId]
      );
      res
        .status(200)
        .json({ message: this.i18n.translate(req, msgKey.user.urlAddedSuccessfully) });
    } catch (error) {
      console.error("Error adding URL:", error);
      res
        .status(500)
        .json({ message: this.i18n.translate(req, msgKey.user.failedToAddUrl), error });
    }
  }

  async getUserProjectURL(req: Request, res: Response): Promise<void> {
    const { userEmail, projectName } = req.query;

    if (!userEmail || !projectName) {
      res
        .status(400)
        .json({
          message: this.i18n.translate(req, msgKey.user.userEmailAndProjectNameMandatory),
        });
      return;
    }

    try {
      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail.toString());
      const projectId = await DatabaseHelpers.getProjectIdFromName(this.db, projectName.toString());
      const urlObj = await this.db.get(
        `SELECT url FROM user_projects WHERE userId = ? AND projectId = ?`,
        [userId, projectId]
      );
      const url = urlObj ? urlObj.url : null;
      res.status(200).json({ url });
    } catch (error) {
      console.error("Error fetching URL:", error);
      res
        .status(500)
        .json({ message: this.i18n.translate(req, msgKey.user.failedToFetchUrl), error });
    }
  }

  async setUserGitHubUsername(req: Request, res: Response): Promise<void> {
    const { userEmail, newGithubUsername } = req.body;

    if (!userEmail) {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.user.userEmailRequiredBang) });
      return;
    }

    if (!newGithubUsername) {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.user.fillInGitHubUsername) });
      return;
    }

    try {
      let userId;
      try {
        userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail);
      } catch (error) {
        if (error instanceof Error && error.message.includes("User not found")) {
          res
            .status(404)
            .json({ message: this.i18n.translate(req, msgKey.common.userNotFound) });
          return;
        }
        throw error;
      }

      await this.db.run(`UPDATE users SET githubUsername = ? WHERE id = ?`, [
        newGithubUsername,
        userId,
      ]);
      res
        .status(200)
        .json({
          message: this.i18n.translate(req, msgKey.user.githubUsernameAddedSuccessfully),
        });
    } catch (error) {
      console.error("Error adding GitHub username:", error);
      res
        .status(500)
        .json({
          message: this.i18n.translate(req, msgKey.user.failedToAddGitHubUsername),
          error,
        });
    }
  }

  async getUserGitHubUsername(req: Request, res: Response): Promise<void> {
    const { userEmail } = req.query;

    if (!userEmail) {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.user.userEmailMandatoryBang) });
      return;
    }

    try {
      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail?.toString());
      const githubUsernameObj = await this.db.get(`SELECT githubUsername FROM users WHERE id = ?`, [
        userId,
      ]);
      const githubUsername = githubUsernameObj?.githubUsername || "";
      res.status(200).json({ githubUsername });
    } catch (error) {
      console.error("Error fetching GitHub username:", error);
      res
        .status(500)
        .json({
          message: this.i18n.translate(req, msgKey.user.failedToFetchGitHubUsername),
          error,
        });
    }
  }

  async getUserRole(req: Request, res: Response): Promise<void> {
    const { userEmail } = req.query;

    try {
      const user = await this.db.get("SELECT userRole FROM users WHERE email = ?", [userEmail]);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: this.i18n.translate(req, msgKey.common.userNotFound) });
      }
    } catch (error) {
      console.error("Error during retrieving user role:", error);
      res
        .status(500)
        .json({
          message: this.i18n.translate(req, msgKey.user.failedToRetrieveUserRole),
          error,
        });
    }
  }

  async updateUserRole(req: Request, res: Response): Promise<void> {
    const { email, role } = req.body;

    if (!email || !role) {
      res.status(400).json({ message: this.i18n.translate(req, msgKey.user.provideEmailAndRole) });
      return;
    }

    try {
      await this.db.run("UPDATE users SET userRole = ? WHERE email = ?", [role, email]);
      res
        .status(200)
        .json({ message: this.i18n.translate(req, msgKey.user.userRoleUpdatedSuccessfully) });
    } catch (error) {
      console.error("Error during updating user role:", error);
      res
        .status(500)
        .json({
          message: this.i18n.translate(req, msgKey.user.failedToUpdateUserRole),
          error,
        });
    }
  }

  private async sendSuspendedEmail(email: string): Promise<void> {
    await this.emailService.sendEmail(
      email,
      this.i18n.translate(msgKey.user.accountSuspendedSubject),
      this.i18n.translate(msgKey.user.accountSuspendedBody)
    );
  }

  private async sendRemovedEmail(email: string): Promise<void> {
    await this.emailService.sendEmail(
      email,
      this.i18n.translate(msgKey.user.accountRemovedSubject),
      this.i18n.translate(msgKey.user.accountRemovedBody)
    );
  }
}
