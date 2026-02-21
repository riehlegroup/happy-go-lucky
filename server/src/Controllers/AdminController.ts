import { Application, Request, Response } from 'express';
import { Server } from 'http';
import { Database } from 'sqlite';
import { IAppController } from './IAppController';
import { checkAdmin } from '../Middleware/checkAdmin';

/**
 * Administrative controller.
 *
 * Provides a power endpoint that:
 * - marks the app as "shutting down" (read-only mode)
 * - blocks write requests while still allowing read requests
 * - fully stops the server after a configurable grace period
 */
export class AdminController implements IAppController {
  private server?: Server;
  private shutdownTimer: NodeJS.Timeout | null = null;

  constructor(private db: Database) {}

  setServer(server: Server): void {
    this.server = server;
  }

  init(app: Application): void {
    app.get('/admin/power', checkAdmin(this.db), this.getPowerStatus.bind(this));
    app.post('/admin/power', checkAdmin(this.db), this.setPowerStatus.bind(this));
  }

  async getPowerStatus(req: Request, res: Response): Promise<void> {
    const app = req.app;
    const shutdownAt = app.locals.shutdownAt as number | null;
    const graceSeconds = Number(app.locals.shutdownGraceSeconds) || 10;

    res.status(200).json({
      status: app.locals.isShuttingDown ? 'shutdown' : 'startup',
      isShuttingDown: Boolean(app.locals.isShuttingDown),
      shutdownAt,
      gracePeriodSeconds: graceSeconds,
    });
  }

  async setPowerStatus(req: Request, res: Response): Promise<void> {
    const app = req.app;
    const status = String(req.body?.status || '').toLowerCase();
    const graceSeconds = Number(app.locals.shutdownGraceSeconds) || 10;

    if (status !== 'shutdown' && status !== 'startup') {
      res.status(400).json({
        success: false,
        message: 'Invalid status. Use "shutdown" or "startup".',
      });
      return;
    }

    if (status === 'shutdown') {
      if (app.locals.isShuttingDown) {
        res.status(200).json({ success: true, message: 'Shutdown already in progress' });
        return;
      }

      app.locals.isShuttingDown = true;
      const shutdownAt = Date.now() + graceSeconds * 1000;
      app.locals.shutdownAt = shutdownAt;

      if (this.shutdownTimer) {
        clearTimeout(this.shutdownTimer);
      }

      this.shutdownTimer = setTimeout(() => {
        if (!this.server || app.locals.isShuttingDown !== true) {
          return;
        }

        // Trigger graceful shutdown via SIGTERM to reuse existing logic.
        process.kill(process.pid, 'SIGTERM');
      }, graceSeconds * 1000);

      res.status(202).json({
        success: true,
        message: 'Shutdown mode enabled',
        shutdownAt,
        gracePeriodSeconds: graceSeconds,
      });
      return;
    }

    if (!app.locals.isShuttingDown) {
      res.status(200).json({ success: true, message: 'System already running' });
      return;
    }

    if (this.shutdownTimer) {
      clearTimeout(this.shutdownTimer);
      this.shutdownTimer = null;
    }

    app.locals.isShuttingDown = false;
    app.locals.shutdownAt = null;
    res.status(200).json({ success: true, message: 'Shutdown mode disabled' });
  }
}
