import { Application, Request, Response } from "express";
import { Database } from "sqlite";
import { CourseManager } from "../Managers/CourseManager";
import { Course } from "../Models/Course";
import { Exception } from "../Exceptions/Exception";
import { IllegalArgumentException } from "../Exceptions/IllegalArgumentException";
import { IAppController } from "./IAppController";
import { ObjectHandler } from "../ObjectHandler";
import { checkAdmin } from "../Middleware/checkAdmin";

/**
 * Controller for handling course-related HTTP requests.
 * Connects API routes to the CourseManager, which interacts with the database.
 * Each method processing HTTP requests and returning JSON responses.
 */
export class CourseController implements IAppController {
  private cm: CourseManager;

  constructor(private db: Database) {
    const oh = new ObjectHandler();
    this.cm = new CourseManager(db, oh);
  }

  /**
   * Initializes API routes for course management.
   * @param app Express application instance
   */
  init(app: Application): void {
    app.post("/course", this.createCourse.bind(this));
    app.get("/course", this.getAllCourse.bind(this));
    app.delete("/course/:id", checkAdmin(this.db), this.deleteCourse.bind(this));
    app.post("/courseProject", this.addProject.bind(this));
    app.get("/course/courseProjects", this.getCourseProjects.bind(this));
    app.put("/courseProject/:id", this.updateProject.bind(this));
    app.delete("/courseProject/:id", this.deleteProject.bind(this));
    app.post("/course/:id/schedule", this.saveSchedule.bind(this));
    app.get("/course/:id/schedule", this.getSchedule.bind(this));
  }

  async getAllCourse(req: Request, res: Response): Promise<void> {
    try {
      let courses: Course[] = [];
      courses = await this.cm.getAllCourse();

      res.status(200).json({
        success: true,
        data: courses.map((course) => ({
          id: course.getId(),
          courseName: course.getName(),
          termId: course.getTerm()?.getId(),
        })),
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  async createCourse(req: Request, res: Response): Promise<void> {
    try {
      const { courseName, termId } = req.body;

      if (!courseName || typeof courseName !== "string") {
        res.status(400).json({
          success: false,
          message: "Course name is required and must be a string",
        });
        return;
      }

      if (termId === undefined || termId === null) {
        res.status(400).json({
          success: false,
          message: "Term ID is required",
        });
        return;
      }

      const id = parseInt(termId);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "Term ID must be a valid number",
        });
        return;
      }

      const course = await this.cm.createCourse(courseName, id);

      res.status(201).json({
        success: true,
        message: "Course created successfully",
        data: course,
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  async readCourse(req: Request, res: Response): Promise<void> {
    try {
      const id = req.body.id;
      const courseId = parseInt(id);

      if (isNaN(courseId)) {
        res
          .status(400)
          .json({ success: false, message: "Course ID must be an integer" });
        return;
      }

      const course = await this.cm.readCourse(courseId);

      if (!course) {
        res.status(404).json({ success: false, message: "Course not found" });
        return;
      }

      res.status(200).json({
        success: true,
        data: course,
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  // This method is not implemented yet
  async updateCourse(req: Request, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        message: "Course delete not implemented yet",
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  async deleteCourse(req: Request, res: Response): Promise<void> {
    try {
      const courseId = parseInt(String(req.params.id));

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          message: "Course ID must be a valid number"
        });
        return;
      }

      const deleted = await this.cm.deleteCourse(courseId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Course not found"
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  // This method is not implemented yet
  async getUserCourses(req: Request, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        message: "User courses not implemented yet",
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  // Composition methods for CourseProject 1:N
  async addProject(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, projectName } = req.body;

      // Validate courseId is provided
      if (courseId === undefined || courseId === null) {
        res.status(400).json({
          success: false,
          message: "Course ID is required",
        });
        return;
      }

      // Validate courseId is numeric
      const id = parseInt(courseId);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid course ID format",
        });
        return;
      }

      const proj = await this.cm.addProjectToCourse(id, projectName);

      // console.log("[CONTROLLER] addProject: ", proj.getName());
      res.status(201).json({
        success: true,
        message: "Project added successfully",
        data: {
          id: proj.getId(),
          projectName: proj.getName(),
          courseId: proj.getCourse()?.getId(),
        },
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  async getCourseProjects(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, userEmail } = req.query;

      if (!courseId || typeof courseId !== 'string') {
        res.status(400).json({ success: false, message: "Course ID is required" });
        return;
      }

      const id = parseInt(courseId);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid course ID" });
        return;
      }

      const course = await this.cm.readCourse(id);
      if (!course) {
        res.status(404).json({ success: false, message: "Course not found" });
        return;
      }

      const projects = await this.cm.getProjectsForCourse(course);
      if (!projects) {
        res.status(404).json({ success: false, message: "Course projects not found" });
        return;
      }

      // If userEmail is provided, split into enrolled and available projects
      if (userEmail && typeof userEmail === 'string') {
        const userResult = await this.db.get('SELECT id FROM users WHERE email = ?', [userEmail]);
        if (userResult) {
          const userProjects = await this.db.all(
            'SELECT projectId FROM user_projects WHERE userId = ?',
            [userResult.id]
          );
          const userProjectIds = new Set(userProjects.map((up: { projectId: number }) => up.projectId));

          const enrolledProjects = projects.filter(proj => userProjectIds.has(proj.getId()));
          const availableProjects = projects.filter(proj => !userProjectIds.has(proj.getId()));

          res.status(200).json({
            success: true,
            enrolledProjects: enrolledProjects.map((proj) => ({
              id: proj.getId(),
              projectName: proj.getName(),
              courseId: proj.getCourse()?.getId(),
            })),
            availableProjects: availableProjects.map((proj) => ({
              id: proj.getId(),
              projectName: proj.getName(),
              courseId: proj.getCourse()?.getId(),
            })),
          });
          return;
        }
      }

      // Default response without user filtering
      res.status(200).json({
        success: true,
        data: projects.map((proj) => ({
          id: proj.getId(),
          projectName: proj.getName(),
          courseId: proj.getCourse()?.getId(),
        })),
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const projectId = parseInt(String(req.params.id));
      const { projectName, courseId } = req.body;

      if (isNaN(projectId)) {
        res.status(400).json({
          success: false,
          message: "Project ID must be a valid number"
        });
        return;
      }

      if (!projectName || typeof projectName !== "string") {
        res.status(400).json({
          success: false,
          message: "Project name is required and must be a string"
        });
        return;
      }

      const updatedProject = await this.cm.updateProject(projectId, projectName, courseId);

      if (!updatedProject) {
        res.status(404).json({
          success: false,
          message: "Project not found"
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Project updated successfully",
        data: {
          id: updatedProject.getId(),
          projectName: updatedProject.getName(),
          courseId: updatedProject.getCourse()?.getId(),
        },
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const projectId = parseInt(String(req.params.id));

      if (isNaN(projectId)) {
        res.status(400).json({
          success: false,
          message: "Project ID must be a valid number"
        });
        return;
      }

      const deleted = await this.cm.deleteProject(projectId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Project not found"
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Project deleted successfully",
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  async saveSchedule(req: Request, res: Response): Promise<void> {
    try {
      const courseId = parseInt(String(req.params.id));
      const { startDate, endDate, submissionDates } = req.body;

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          message: "Course ID must be a valid number"
        });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: "Start date and end date are required"
        });
        return;
      }

      const schedule = await this.cm.saveSchedule(
        courseId,
        new Date(startDate),
        new Date(endDate),
        submissionDates ? submissionDates.map((d: string) => new Date(d)) : []
      );

      res.status(200).json({
        success: true,
        message: "Schedule saved successfully",
        data: {
          id: schedule.getId(),
          startDate: schedule.getStartDate(),
          endDate: schedule.getEndDate(),
          submissionDates: schedule.getSubmissionDates().map(sd => sd.getSubmissionDate()),
        },
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  async getSchedule(req: Request, res: Response): Promise<void> {
    try {
      const courseId = parseInt(String(req.params.id));

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          message: "Course ID must be a valid number"
        });
        return;
      }

      const schedule = await this.cm.getSchedule(courseId);

      if (!schedule) {
        res.status(404).json({
          success: false,
          message: "Schedule not found for this course"
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: schedule.getId(),
          startDate: schedule.getStartDate(),
          endDate: schedule.getEndDate(),
          submissionDates: schedule.getSubmissionDates().map(sd => sd.getSubmissionDate()),
        },
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  // Error handling for responses
  private handleError(res: Response, error: Exception): void {
    console.error("Controller error:", error);

    // Check for specific error types and return responses
    if (error instanceof IllegalArgumentException) {
      const msg = error.message.toLowerCase();
      // Check for "not found" patterns → 404
      if (msg.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }
      // All other IllegalArgumentException are validation errors → 400
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    } else if (error.name === "MethodFailedException") {
      res.status(500).json({
        success: false,
        message: "An error occurred while processing your request",
      });
      return;
    } else {
      // Check for DatabaseManager "not found" patterns → 404
      const msg = error.message || '';
      if (msg.includes('Unknown Course Name!') || msg.includes('User not found')) {
        res.status(404).json({
          success: false,
          message: "Resource not found",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
