import { Request, Response, NextFunction } from "express";
import { AuthentificationRepo } from "../repositories/authentification.repository";
import jwt from "jsonwebtoken";
import { DatabaseUser } from "../types/user.types";
import { CompetitionRepo } from "../repositories/competition.repository";
import { CompetitionService } from "../services/competition.service";
import { Competition } from "../types/competition.types";

const secretKey = process.env.JWT_SECRET || "your_jwt_secret";

/**
 * Middleware to require authentication. It checks for a valid JWT token in the Authorization header, checks if the user with the ID from the token exists, and attaches the user to the request object if valid for later use.
 * @param authRepo
 * @returns
 */
export const requireAuth = (authRepo: AuthentificationRepo) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, secretKey) as {
        id: string;
        email: string;
      };
      const userFromTokenId: DatabaseUser | undefined = await authRepo.getById(
        Number(decoded.id),
      );
      if (!userFromTokenId) {
        return res
          .status(401)
          .json({ message: "User with token userId not found" });
      }
      req.user = userFromTokenId; // Attach the user to the request object for further use
    } catch (error) {
      console.error("middleware error: ", error);
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    next();
  };
};


/**
 * Checks if a competition with the given ID exists. If it dos not exist, it returns a 404 response. If it exists, it attaches the competition to the request object for further use.
 * Requires the competition ID to be present in the request parameters (:id in path).
 * @param competitionService 
 */
export const requireCompetitionExists = (competitionService: CompetitionService) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const competitionId = Number(req.params.id); // Takes the competition ID from the path parameter

        if (isNaN(competitionId)) {
            return res.status(400).json({ message: "Missing competition ID" });
        }

        try {
            const competition = await competitionService.getCompetitionById(competitionId);
            if (!competition) {
                return res.status(404).json({ message: "Competition not found" });
            }
            req.competition = competition; // Attach the competition to the request object for further use
            next();
        } catch (error) {
            console.error("DB Error in competition existence check: ", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    };
};


/**
 * middleware to check if the user is a member of the course associated with the competition (admin is also allowed). Only use after requireAuth and requireCompetitionExists middleware.
 * @param authRepo
 * @returns
 */
export const requireCourseMember = (
  authRepo: AuthentificationRepo,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as DatabaseUser;
    const competition = req.competition as Competition; // Takes the competition from the previous middleware

    if (!competition || !user) {
      return res
        .status(400)
        .json({ message: "Missing competition or user information" });
    }

    const isMemberOfCourse = await authRepo.userIsInCourse(
      user.id,
      competition.courseId,
    );

    if (!isMemberOfCourse && user.userRole !== "ADMIN") {
      return res
        .status(403)
        .json({
          message:
            "User is not a member of the course associated with this competition",
        });
    }
    next();
  };
};

export const requireAdmin = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as DatabaseUser;
    if (!user) {
      return res.status(400).json({ message: "Missing user information" });
    }
    
    if (user.userRole !== "ADMIN") {
      return res.status(403).json({ message: "User is not an admin" });
    }
    next();
  };
};
