import { Application, Request, Response } from 'express';
import { Database } from 'sqlite';
import { IAppController } from './IAppController';
import { checkAdmin } from '../Middleware/checkAdmin';

/**
 * Administrative controller.
 *
 * Provides a shutdown mode endpoint that:
 * - marks the app as "shutting down" (read-only mode)
 * - blocks write requests while still allowing read requests
 */
export class AdminController implements IAppController {
  constructor(private db: Database) {}

  init(app: Application): void {
    app.get(
      '/admin/shutdown/status',
      checkAdmin(this.db),
      this.getShutdownStatus.bind(this)
    );
    app.post('/admin/shutdown', checkAdmin(this.db), this.shutdown.bind(this));
    app.post('/admin/start', checkAdmin(this.db), this.start.bind(this));
  }

  async getShutdownStatus(req: Request, res: Response): Promise<void> {
    res.status(200).json({ isShuttingDown: Boolean(req.app.locals.isShuttingDown) });
  }

  async shutdown(req: Request, res: Response): Promise<void> {
    const app = req.app;

    if (app.locals.isShuttingDown) {
      res.status(200).json({ success: true, message: 'Shutdown already in progress' });
      return;
    }

    app.locals.isShuttingDown = true;

    // Enter read-only mode.
    res.status(202).json({ success: true, message: 'Shutdown mode enabled' });
  }

  async start(req: Request, res: Response): Promise<void> {
    const app = req.app;

    if (!app.locals.isShuttingDown) {
      res.status(200).json({ success: true, message: 'System already running' });
      return;
    }

    app.locals.isShuttingDown = false;
    res.status(200).json({ success: true, message: 'Shutdown mode disabled' });
  }
}
