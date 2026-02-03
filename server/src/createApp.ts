import express, { Application } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Database } from 'sqlite';
import { CourseController } from './Controllers/CourseController';
import { TermController } from './Controllers/TermController';
import { AuthController } from './Controllers/AuthController';
import { UserController } from './Controllers/UserController';
import { ProjectController } from './Controllers/ProjectController';
import { LegacyController } from './Controllers/LegacyController';
import { AdminController } from './Controllers/AdminController';
import { IEmailService } from './Services/IEmailService';
import { ConsoleEmailService } from './Services/ConsoleEmailService';
import { SmtpEmailService } from './Services/SmtpEmailService';
import { LocalMtaEmailService } from './Services/LocalMtaEmailService';
import { EMAIL_CONFIG } from './Config/email';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const ALLOW_DURING_SHUTDOWN_PATHS = new Set([
  '/admin/shutdown',
  '/admin/start',
  '/admin/shutdown/status',
  '/session',
]);

/**
 * Creates and configures an Express application with all routes
 * @param db Database instance to use for all endpoints
 * @returns Configured Express application
 */
export function createApp(db: Database): Application {
  const app = express();

  app.use(bodyParser.json());
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));

  // Global shutdown flag. Once shutdown is initiated, reject write requests
  // so the DB stays in a consistent state (read-only mode).
  app.locals.isShuttingDown = false;
  app.use((req, res, next) => {
    if (!app.locals.isShuttingDown) {
      next();
      return;
    }

    if (
      ALLOW_DURING_SHUTDOWN_PATHS.has(req.path) ||
      SAFE_METHODS.has(req.method.toUpperCase())
    ) {
      next();
      return;
    }

    res
      .status(503)
      .json({ message: 'Writes are disabled while server is shutting down' });
  });

  app.get('/', (req, res) => {
    res.send('Server is running!');
  });

  // Initialize email service based on environment
  let emailService: IEmailService;

  if (process.env.NODE_ENV === 'production') {
    // Production: use SMTP if credentials available, otherwise fallback to local MTA
    if (process.env.EMAIL_USER_FAU && process.env.EMAIL_PASS_FAU) {
      emailService = new SmtpEmailService(
        EMAIL_CONFIG.sender.name,
        EMAIL_CONFIG.sender.address,
        EMAIL_CONFIG.smtp.host,
        EMAIL_CONFIG.smtp.port,
        EMAIL_CONFIG.smtp.secure
      );
    } else {
      emailService = new LocalMtaEmailService(
        EMAIL_CONFIG.sender.name,
        EMAIL_CONFIG.sender.address
      );
    }
  } else {
    // Development: log to console
    emailService = new ConsoleEmailService(
      EMAIL_CONFIG.sender.name,
      EMAIL_CONFIG.sender.address
    );
  }

  // Initialize all controllers
  const courseController = new CourseController(db);
  const termController = new TermController(db);
  const authController = new AuthController(db, emailService);
  const userController = new UserController(db, emailService);
  const projectController = new ProjectController(db, emailService);
  const legacyController = new LegacyController(db);
  const adminController = new AdminController(db);

  // Register all routes
  courseController.init(app);
  termController.init(app);
  authController.init(app);
  userController.init(app);
  projectController.init(app);
  legacyController.init(app);
  adminController.init(app);

  return app;
}
