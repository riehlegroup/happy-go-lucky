import { Application, Request, Response } from "express";
import { Database } from "sqlite";
import { DatabaseHelpers } from "../Models/DatabaseHelpers";
import { Email } from "../ValueTypes/Email";
import { IAppController } from "./IAppController";
import { IEmailService } from "../Services/IEmailService";
import { II18nService, msgKey } from "../Services/I18nService";

/**
 * Controller for handling project-related HTTP requests.
 * Manages project CRUD, user-project relationships, and project features
 * (happiness metrics, sprints, standups).
 */
export class ProjectController implements IAppController {
  constructor(
    private db: Database,
    private emailService: IEmailService,
    private i18n: II18nService
  ) {}

  /**
   * Initializes API routes for project management.
   * @param app Express application instance
   */
  init(app: Application): void {
    // Project management
    app.get("/courseProject", this.getProjects.bind(this));
    app.put("/courseProject", this.editProject.bind(this));
    app.get("/courseProject/course", this.getCourseForProject.bind(this));
    app.get("/courseProject/user/role", this.getRoleForProject.bind(this));

    // User-project relationships
    app.post("/user/project", this.joinProject.bind(this));
    app.delete("/user/project", this.leaveProject.bind(this));
    app.get("/user/projects", this.getUserProjects.bind(this));
    app.get("/user/courses", this.getEnrolledCourses.bind(this));

    // Project features: Happiness
    app.post("/courseProject/happiness", this.saveHappinessMetric.bind(this));
    app.get("/courseProject/happiness", this.getProjectHappinessMetrics.bind(this));
    app.get("/courseProject/availableSubmissions", this.getAvailableSubmissions.bind(this));

    // Project features: Standups
    app.post("/courseProject/standupsEmail", this.sendStandupEmails.bind(this));
  }

  async getProjects(req: Request, res: Response): Promise<void> {
    const { courseName } = req.query;

    if (!courseName) {
      res.status(400).json({ message: this.i18n.translate(req, msgKey.project.courseIdIsRequired) });
      return;
    }

    try {
      let courseId;
      try {
        courseId = await DatabaseHelpers.getCourseIdFromName(this.db, courseName.toString());
      } catch (error) {
        if (error instanceof Error && error.message.includes("Unknown Course Name!")) {
          res.status(404).json({ message: this.i18n.translate(req, msgKey.common.courseNotFound) });
          return;
        }
        throw error;
      }

      const projects = await this.db.all("SELECT * FROM projects WHERE courseId = ?", [courseId]);
      res.json(projects);
    } catch (error) {
      console.error("Error during project retrieval:", error);
      res
        .status(500)
        .json({
          message: this.i18n.translate(
            req,
            msgKey.project.failedToRetrieveProjectsForCourse,
            courseName
          ),
          error,
        });
    }
  }

  async editProject(req: Request, res: Response): Promise<void> {
    const { newCourseName, projectName, newProjectName } = req.body;

    if (!newCourseName || !newProjectName) {
      res
        .status(400)
        .json({
          message: this.i18n.translate(req, msgKey.project.fillInProjectGroupAndProjectName),
        });
      return;
    }

    try {
      const newCourseId = await DatabaseHelpers.getCourseIdFromName(this.db, newCourseName);
      const projectId = await DatabaseHelpers.getProjectIdFromName(this.db, projectName);
      await this.db.run(`UPDATE projects SET projectName = ?, courseId = ? WHERE id = ?`, [
        newProjectName,
        newCourseId,
        projectId,
      ]);
      res
        .status(201)
        .json({ message: this.i18n.translate(req, msgKey.project.projectEditedSuccessfully) });
    } catch (error) {
      console.error("Error during project edition:", error);
      res.status(500).json({
        message: this.i18n.translate(req, msgKey.project.projectEditionFailed),
        error,
      });
    }
  }

  async getCourseForProject(req: Request, res: Response): Promise<void> {
    const { projectName } = req.query;

    if (!projectName) {
      res.status(400).json({ message: this.i18n.translate(req, msgKey.project.projectNameIsRequired) });
      return;
    }

    try {
      const course = await this.db.get(
        `SELECT c.id as courseId, c.courseName FROM courses c
         INNER JOIN projects p ON p.courseId = c.id
         WHERE p.projectName = ?`,
        [projectName]
      );

      if (course) {
        res.json(course);
      } else {
        res
          .status(404)
          .json({ message: this.i18n.translate(req, msgKey.project.courseNotFoundForProject) });
      }
    } catch (error) {
      console.error("Error fetching course for project:", error);
      res.status(500).json({
        message: this.i18n.translate(req, msgKey.project.failedToFetchCourse),
        error,
      });
    }
  }

  async getRoleForProject(req: Request, res: Response): Promise<void> {
    const { projectName } = req.query;

    let userEmail: Email;
    if (!req.query.email || typeof req.query.email !== "string") {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.project.userEmailIsRequired) });
      return;
    }
    try {
      userEmail = new Email(req.query.email as string);
    } catch {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.common.invalidEmailAddress) });
      return;
    }

    if (!projectName) {
      res
        .status(400)
        .json({
          message: this.i18n.translate(req, msgKey.project.projectNameAndUserEmailRequired),
        });
      return;
    }

    try {
      const projectId = await DatabaseHelpers.getProjectIdFromName(this.db, projectName.toString());
      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail.toString());
      const role = await this.db.get(
        `SELECT role
         FROM user_projects
         WHERE userId = ? AND projectId = ?`,
        [userId, projectId]
      );

      if (!role) {
        res.status(404).json({ message: this.i18n.translate(req, msgKey.project.roleNotFound) });
        return;
      }
      res.json({ role: role.role });
    } catch (error) {
      console.error("Error retrieving project role", error);
      res
        .status(500)
        .json({
          message: this.i18n.translate(req, msgKey.project.failedToRetrieveProjectRole),
          error,
        });
    }
  }

  async joinProject(req: Request, res: Response): Promise<void> {
    const { projectName, memberRole, memberEmail: memberEmailStr } = req.body;

    let memberEmail: Email;
    if (!memberEmailStr || typeof memberEmailStr !== "string") {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.project.userEmailIsRequired) });
      return;
    }
    try {
      memberEmail = new Email(memberEmailStr);
    } catch {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.common.invalidEmailAddress) });
      return;
    }

    if (!memberRole) {
      res.status(400).json({ message: this.i18n.translate(req, msgKey.project.fillInYourRole) });
      return;
    }

    try {
      let projectId;
      try {
        projectId = await DatabaseHelpers.getProjectIdFromName(this.db, projectName);
      } catch (error) {
        if (error instanceof Error && error.message.includes("Unknown Project Name!")) {
          res.status(404).json({ message: this.i18n.translate(req, msgKey.common.projectNotFound) });
          return;
        }
        throw error;
      }

      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, memberEmail.toString());
      const isMember = await this.db.get(
        `SELECT * FROM user_projects WHERE userId = ? AND projectId = ?`,
        [userId, projectId]
      );
      if (isMember) {
        res
          .status(400)
          .json({ message: this.i18n.translate(req, msgKey.project.alreadyJoinedProject) });
        return;
      }

      await this.db.run("INSERT INTO user_projects (userId, projectId, role) VALUES (?, ?, ?)", [
        userId,
        projectId,
        memberRole,
      ]);
      res
        .status(201)
        .json({ message: this.i18n.translate(req, msgKey.project.joinedProjectSuccessfully) });
    } catch (error) {
      console.error("Error during joining project:", error);
      res.status(500).json({
        message: this.i18n.translate(req, msgKey.project.failedToJoinProject),
        error,
      });
    }
  }

  async leaveProject(req: Request, res: Response): Promise<void> {
    const { userEmail, projectName } = req.body;

    try {
      let projectId;
      try {
        projectId = await DatabaseHelpers.getProjectIdFromName(this.db, projectName);
      } catch (error) {
        if (error instanceof Error && error.message.includes("Unknown Project Name!")) {
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
        res
          .status(400)
          .json({ message: this.i18n.translate(req, msgKey.project.notMemberOfProject) });
        return;
      }
      await this.db.run("DELETE FROM user_projects WHERE userId = ? AND projectId = ?", [
        userId,
        projectId,
      ]);

      res
        .status(200)
        .json({ message: this.i18n.translate(req, msgKey.project.leftProjectSuccessfully) });
    } catch (error) {
      console.error("Error during leaving project:", error);
      res.status(500).json({
        message: this.i18n.translate(req, msgKey.project.failedToLeaveProject),
        error,
      });
    }
  }

  async getUserProjects(req: Request, res: Response): Promise<void> {
    let userEmail: Email;
    if (!req.query.userEmail || typeof req.query.userEmail !== "string") {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.project.userEmailIsRequired) });
      return;
    }
    try {
      userEmail = new Email(req.query.userEmail as string);
    } catch {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.common.invalidEmailAddress) });
      return;
    }

    try {
      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail.toString());
      const projects = await this.db.all(
        `SELECT p.id, p.projectName
         FROM user_projects up
         INNER JOIN projects p ON up.projectId = p.id
         WHERE up.userId = ?`,
        [userId]
      );
      res.json(projects);
    } catch (error) {
      console.error("Error during retrieving user projects:", error);
      res
        .status(500)
        .json({
          message: this.i18n.translate(req, msgKey.project.failedToRetrieveUserProjects),
          error,
        });
    }
  }

  async getEnrolledCourses(req: Request, res: Response): Promise<void> {
    let userEmail: Email;
    if (!req.query.userEmail || typeof req.query.userEmail !== "string") {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.project.userEmailIsRequired) });
      return;
    }
    try {
      userEmail = new Email(req.query.userEmail as string);
    } catch {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.common.invalidEmailAddress) });
      return;
    }

    try {
      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail.toString());
      const courses = await this.db.all(
        `SELECT DISTINCT c.id, c.courseName
         FROM user_projects up
         INNER JOIN projects p ON up.projectId = p.id
         INNER JOIN courses c ON p.courseId = c.id
         WHERE up.userId = ?`,
        [userId]
      );
      res.json(courses);
    } catch (error) {
      console.error("Error during retrieving courses of user:", error);
      res
        .status(500)
        .json({
          message: this.i18n.translate(req, msgKey.project.failedToRetrieveCoursesOfUser),
          error,
        });
    }
  }

  async saveHappinessMetric(req: Request, res: Response): Promise<void> {
    const { projectName, userEmail, happiness, submissionDateId } = req.body;
    const timestamp = new Date().toISOString();

    if (!submissionDateId || typeof submissionDateId !== 'number') {
      res
        .status(400)
        .json({
          message: this.i18n.translate(req, msgKey.project.submissionDateIdRequiredNumber),
        });
      return;
    }

    try {
      // Verify submission date exists
      const submission = await this.db.get(
        'SELECT id FROM submissions WHERE id = ?',
        [submissionDateId]
      );
      if (!submission) {
        res
          .status(404)
          .json({ message: this.i18n.translate(req, msgKey.project.submissionDateNotFound) });
        return;
      }

      // Get project and user IDs
      const projectId = await this.db.get(
        'SELECT id FROM projects WHERE projectName = ?',
        [projectName]
      );
      const userId = await this.db.get(
        'SELECT id FROM users WHERE email = ?',
        [userEmail]
      );

      if (!projectId || !userId) {
        res
          .status(404)
          .json({ message: this.i18n.translate(req, msgKey.project.projectOrUserNotFound) });
        return;
      }

      // Delete existing happiness entry for this user/project/submission
      await this.db.run(
        `DELETE FROM happiness
         WHERE projectId = ? AND userId = ? AND submissionDateId = ?`,
        [projectId.id, userId.id, submissionDateId]
      );

      // Insert new happiness entry
      await this.db.run(
        `INSERT INTO happiness (projectId, userId, happiness, submissionDateId, timestamp)
         VALUES (?, ?, ?, ?, ?)`,
        [projectId.id, userId.id, happiness, submissionDateId, timestamp]
      );

      res
        .status(200)
        .json({
          message: this.i18n.translate(req, msgKey.project.happinessUpdatedSuccessfully),
        });
    } catch (error) {
      console.error("Error updating happiness:", error);
      res
        .status(500)
        .json({
          message: this.i18n.translate(req, msgKey.project.failedToUpdateHappiness),
          error,
        });
    }
  }

  async getProjectHappinessMetrics(req: Request, res: Response): Promise<void> {
    const { projectName } = req.query;
    try {
      const happinessData = await this.db.all(
        `SELECT happiness.*, submissions.submissionDate, users.email as userEmail
        FROM happiness
        LEFT JOIN submissions ON happiness.submissionDateId = submissions.id
        LEFT JOIN users ON happiness.userId = users.id
        WHERE happiness.projectId = (SELECT id FROM projects WHERE projectName = ?)
        ORDER BY submissions.submissionDate ASC, happiness.timestamp ASC`,
        [projectName]
      );
      res.json(happinessData);
    } catch (error) {
      console.error("Error fetching happiness data:", error);
      res
        .status(500)
        .json({
          message: this.i18n.translate(req, msgKey.project.failedToFetchHappinessData),
          error,
        });
    }
  }

  async getAvailableSubmissions(req: Request, res: Response): Promise<void> {
    const { projectName } = req.query;

    if (!projectName || typeof projectName !== 'string') {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.project.projectNameIsRequired) });
      return;
    }

    try {
      // Get project and its courseId
      const project = await this.db.get(
        'SELECT courseId FROM projects WHERE projectName = ?',
        [projectName]
      );

      if (!project) {
        res.status(404).json({ message: this.i18n.translate(req, msgKey.common.projectNotFound) });
        return;
      }

      const courseId = project.courseId;

      // Check if schedule exists for this course
      const schedule = await this.db.get(
        'SELECT id FROM schedules WHERE id = ?',
        [courseId]
      );

      if (!schedule) {
        res
          .status(404)
          .json({ message: this.i18n.translate(req, msgKey.project.noScheduleFoundForCourse) });
        return;
      }

      // Get next available submission date (future dates only)
      const currentTimestampSeconds = Math.floor(Date.now() / 1000);
      const nextSubmission = await this.db.get(
        `SELECT id, submissionDate, scheduleId
         FROM submissions
         WHERE scheduleId = ? AND submissionDate > ?
         ORDER BY submissionDate ASC
         LIMIT 1`,
        [courseId, currentTimestampSeconds]
      );

      if (!nextSubmission) {
        res
          .status(404)
          .json({
            message: this.i18n.translate(req, msgKey.project.noFutureSubmissionDatesAvailable),
          });
        return;
      }

      res.json({
        id: nextSubmission.id,
        submissionDate: new Date(nextSubmission.submissionDate * 1000).toISOString(),
        scheduleId: nextSubmission.scheduleId
      });
    } catch (error) {
      console.error("Error fetching available submissions:", error);
      res
        .status(500)
        .json({
          message: this.i18n.translate(req, msgKey.project.failedToFetchAvailableSubmissions),
          error,
        });
    }
  }

  async sendStandupEmails(req: Request, res: Response): Promise<void> {
    const { projectName, userName, doneText, plansText, challengesText } = req.body;

    try {
      const members = await this.db.all(
        `SELECT users.email FROM users
                INNER JOIN user_projects ON user_projects.userId = users.id
                INNER JOIN projects ON user_projects.projectId = projects.id
                WHERE projects.projectName = ?`,
        [projectName]
      );

      console.log(`Found ${members.length} members for project "${projectName}":`, members);

      if (members.length === 0) {
        res
          .status(400)
          .json({ message: this.i18n.translate(req, msgKey.project.noMembersInProjectGroup) });
        return;
      }

      const recipientEmails = members.map((member) => member.email).join(",");

      await this.emailService.sendEmail(
        recipientEmails,
        this.i18n.translate(req, msgKey.project.standupEmailSubject, projectName),
        this.i18n.translate(
          req,
          msgKey.project.standupEmailBody,
          userName,
          doneText,
          plansText,
          challengesText
        )
      );

      res
        .status(200)
        .json({
          message: this.i18n.translate(req, msgKey.project.standupEmailSentSuccessfully),
        });
    } catch (error) {
      console.error("Error sending standup email:", error);
      res
        .status(500)
        .json({
          message: this.i18n.translate(req, msgKey.project.failedToSendStandupEmail),
          error,
        });
    }
  }
}
