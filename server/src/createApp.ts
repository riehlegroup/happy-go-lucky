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
import { IEmailService } from './Services/IEmailService';
import { ConsoleEmailService } from './Services/ConsoleEmailService';
import { SmtpEmailService } from './Services/SmtpEmailService';
import { LocalMtaEmailService } from './Services/LocalMtaEmailService';
import { EMAIL_CONFIG } from './Config/email';
import { createI18nFromEnv, II18nService } from './Services/I18nService';

/**
 * Creates and configures an Express application with all routes
 * @param db Database instance to use for all endpoints
 * @returns Configured Express application
 */
export function createApp(db: Database): Application {
  const app = express();

  app.use(bodyParser.json());
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));

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

  const i18n: II18nService = createI18nFromEnv();
  
  // Initialize all controllers
  const courseController = new CourseController(db, i18n);
  const termController = new TermController(db, i18n);
  const authController = new AuthController(db, emailService, i18n);
  const userController = new UserController(db, emailService, i18n);
  const projectController = new ProjectController(db, emailService, i18n);
  const legacyController = new LegacyController(db, i18n);

  // Register all routes
  courseController.init(app);
  termController.init(app);
  authController.init(app);
  userController.init(app);
  projectController.init(app);
  legacyController.init(app);

  return app;
}
