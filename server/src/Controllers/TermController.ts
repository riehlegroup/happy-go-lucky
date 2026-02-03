import { Application, Request, Response } from "express";
import { Database } from "sqlite";
import { TermManager } from "../Managers/TermManager";
import { Term } from "../Models/Term";
import { Exception } from "../Exceptions/Exception";
import { IllegalArgumentException } from "../Exceptions/IllegalArgumentException";
import { IAppController } from "./IAppController";
import { ObjectHandler } from "../ObjectHandler";
import { checkAdmin } from "../Middleware/checkAdmin";
import { II18nService, msgKey } from "../Services/I18nService";

/**
 * Controller for handling term-related HTTP requests.
 */
export class TermController implements IAppController {
  private tm: TermManager;

  constructor(private db: Database, private i18n: II18nService) {
    const oh = new ObjectHandler();
    this.tm = new TermManager(db, oh);
  }

  /**
   * Initializes API routes for term management.
   */
  init(app: Application): void {
    app.post("/term", checkAdmin(this.db, this.i18n), this.createTerm.bind(this));
    app.get("/term", this.getAllTerms.bind(this));
    app.delete(
      "/term/:id",
      checkAdmin(this.db, this.i18n),
      this.deleteTerm.bind(this)
    );
    app.post(
      "/termCourse",
      checkAdmin(this.db, this.i18n),
      this.addCourse.bind(this)
    );
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
          termName: term.getTermName(),
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
          message: this.i18n.translate(req, msgKey.term.termNameRequiredString),
        });
        return;
      }

      const term = await this.tm.createTerm(termName, displayName);

      res.status(201).json({
        success: true,
        message: this.i18n.translate(req, msgKey.term.termCreatedSuccessfully),
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
          message: this.i18n.translate(req, msgKey.term.termIdMustBeValidNumber),
        });
        return;
      }

      const deleted = await this.tm.deleteTerm(termId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: this.i18n.translate(req, msgKey.term.termNotFound),
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: this.i18n.translate(req, msgKey.term.termDeletedSuccessfully),
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
          message: this.i18n.translate(req, msgKey.term.termIdRequired),
        });
        return;
      }

      const id = parseInt(termId);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: this.i18n.translate(req, msgKey.term.invalidTermIdFormat),
        });
        return;
      }

      const course = await this.tm.addCourseToTerm(id, courseName);

      res.status(201).json({
        success: true,
        message: this.i18n.translate(req, msgKey.term.courseAddedSuccessfully),
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
        res.status(400).json({
          success: false,
          message: this.i18n.translate(req, msgKey.term.termIdRequired),
        });
        return;
      }

      const id = parseInt(termId);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: this.i18n.translate(req, msgKey.term.invalidTermId),
        });
        return;
      }

      const term = await this.tm.readTerm(id);
      if (!term) {
        res.status(404).json({
          success: false,
          message: this.i18n.translate(req, msgKey.term.termNotFound),
        });
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
        message: this.i18n.translate(msgKey.common.requestProcessingError),
      });
      return;
    } else {
      res.status(500).json({
        success: false,
        message: this.i18n.translate(msgKey.common.internalServerError),
      });
    }
  }
}
