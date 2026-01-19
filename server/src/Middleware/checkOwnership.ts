import { Request, Response, NextFunction } from "express";
import { Database } from "sqlite";
import jwt from "jsonwebtoken";
import { ObjectHandler } from "../ObjectHandler";
import { messages } from "../messages";

const secret = process.env.JWT_SECRET || "your_jwt_secret";

/**
 * Middleware to check if user has ownership of the resource.
 * Verifies that authenticated user can only edit their own data, unless they are admin.
 *
 * @param db Database instance
 * @returns Express middleware function
 */
export function checkOwnership(db: Database) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      res
        .status(401)
        .json({ message: messages.middleware.authenticationRequired });
      return;
    }

    try {
      const decoded = jwt.verify(token, secret) as {
        id: string;
        email: string;
      };
      const oh = new ObjectHandler();
      const userFromTokenId = await oh.getUser(Number(decoded.id), db);
      const userFromParamsId = await oh.getUserByMail(req.body.userEmail, db);

      if (!userFromTokenId || !userFromParamsId) {
        res.status(404).json({ message: messages.middleware.userNotFound });
        return;
      }

      if (
        userFromTokenId?.getRole() !== "ADMIN" &&
        userFromParamsId?.getName() !== userFromTokenId?.getName()
      ) {
        res
          .status(403)
          .json({ message: messages.middleware.forbiddenOnlyEditOwnData });
        return;
      }
    } catch {
      res.status(401).json({ message: messages.middleware.invalidToken });
      return;
    }

    next();
  };
}
