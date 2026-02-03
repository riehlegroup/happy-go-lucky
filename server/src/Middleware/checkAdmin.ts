import { Request, Response, NextFunction } from "express";
import { Database } from "sqlite";
import jwt from "jsonwebtoken";
import { ObjectHandler } from "../ObjectHandler";
import { II18nService, msgKey } from "../Services/I18nService";

const secret = process.env.JWT_SECRET || "your_jwt_secret";

/**
 * Middleware to check if user is an admin.
 * Verifies that authenticated user has admin privileges.
 *
 * @param db Database instance
 * @returns Express middleware function
 */
export function checkAdmin(db: Database, i18n: II18nService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      res
        .status(401)
        .json({ success: false, message: i18n.translate(req, msgKey.common.authenticationRequired) });
      return;
    }

    try {
      const decoded = jwt.verify(token, secret) as { id: string; email: string };
      const oh = new ObjectHandler();
      const user = await oh.getUser(Number(decoded.id), db);

      if (!user) {
        res.status(404).json({ success: false, message: i18n.translate(req, msgKey.common.userNotFound) });
        return;
      }

      // Check if user is admin
      if (user.getRole() !== "ADMIN") {
        res.status(403).json({
          success: false,
          message: i18n.translate(req, msgKey.common.adminAccessRequired),
        });
        return;
      }
    } catch {
      res.status(401).json({ success: false, message: i18n.translate(req, msgKey.common.invalidToken) });
      return;
    }

    next();
  };
}
