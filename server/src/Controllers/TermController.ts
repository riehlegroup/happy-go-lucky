import { Application, Request, Response } from "express";
import { Database } from "sqlite";
import { TermManager } from "../Managers/TermManager";
import { Term } from "../Models/Term";
import { Exception } from "../Exceptions/Exception";
import { IllegalArgumentException } from "../Exceptions/IllegalArgumentException";
import { IAppController } from "./IAppController";
import { ObjectHandler } from "../ObjectHandler";
import { checkAdmin } from "../Middleware/checkAdmin";
import { TermName } from "../ValueTypes/TermName";

/**
 * Controller for handling term-related HTTP requests.
 */
export class TermController implements IAppController {
  private tm: TermManager;

  constructor(private db: Database) {
    const oh = new ObjectHandler();
    this.tm = new TermManager(db, oh);
  }

  /**
   * Initializes API routes for term management.
   */
  init(app: Application): void {
    app.post("/term", checkAdmin(this.db), this.createTerm.bind(this));
    app.get("/term", this.getAllTerms.bind(this));
    app.delete("/term/:id", checkAdmin(this.db), this.deleteTerm.bind(this));
    app.post("/termCourse", checkAdmin(this.db), this.addCourse.bind(this));
    app.get("/term/courses", this.getTermCourses.bind(this));
  }

  async getAllTerms(req: Request, res: Response): Promise<void> {
    try {
      let terms: Term[] = [];
      terms = await this.tm.getAllTerms();

      res.status(200).json({
        success: true,
        data: terms.map((term) => ({
          id: term.getId(),
          termName: term.getTermName()?.toString(),
          displayName: term.getDisplayName(),
        })),
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  async createTerm(req: Request, res: Response): Promise<void> {
    try {
      const { termName, displayName } = req.body;

      if (!termName || typeof termName !== "string") {
        res.status(400).json({
          success: false,
          message: "Term name is required and must be a string",
        });
        return;
      }

      let parsedTermName: TermName;
      try {
        parsedTermName = TermName.fromString(termName);
      } catch {
        res.status(400).json({
          success: false,
          message:
            "Invalid term name. Use format: WS24, SS25, WS24/25, Winter 2024 or Summer 2025",
        });
        return;
      }

      const term = await this.tm.createTerm(parsedTermName, displayName);

      res.status(201).json({
        success: true,
        message: "Term created successfully",
        data: term,
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  async deleteTerm(req: Request, res: Response): Promise<void> {
    try {
      const termId = parseInt(String(req.params.id));

      if (isNaN(termId)) {
        res.status(400).json({
          success: false,
          message: "Term ID must be a valid number"
        });
        return;
      }

      const deleted = await this.tm.deleteTerm(termId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Term not found"
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Term deleted successfully",
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  async addCourse(req: Request, res: Response): Promise<void> {
    try {
      const { termId, courseName } = req.body;

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
          message: "Invalid term ID format",
        });
        return;
      }

      const course = await this.tm.addCourseToTerm(id, courseName);

      res.status(201).json({
        success: true,
        message: "Course added successfully",
        data: {
          id: course.getId(),
          courseName: course.getName(),
          termId: course.getTerm()?.getId(),
        },
      });
    } catch (error) {
      this.handleError(res, error as Exception);
    }
  }

  async getTermCourses(req: Request, res: Response): Promise<void> {
    try {
      const { termId } = req.query;

      if (!termId || typeof termId !== 'string') {
        res.status(400).json({ success: false, message: "Term ID is required" });
        return;
      }

      const id = parseInt(termId);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid term ID" });
        return;
      }

      const term = await this.tm.readTerm(id);
      if (!term) {
        res.status(404).json({ success: false, message: "Term not found" });
        return;
      }

      const courses = await this.tm.getCoursesForTerm(term);

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

  private handleError(res: Response, error: Exception): void {
    console.error("Controller error:", error);

    if (error instanceof IllegalArgumentException) {
      const msg = error.message.toLowerCase();
      if (msg.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }
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
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
