import { Request, Response, NextFunction } from "express";
import { AuthentificationRepo } from "../repositories/authentification.repository";
import jwt from "jsonwebtoken";
import { DatabaseUser } from "../types/user.types";
import { CompetitionRepo } from "../repositories/competition.repository";

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
			const userFromTokenId: DatabaseUser | undefined =
				await authRepo.getById(Number(decoded.id));
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
 * middleware to check if the user is a member of the course associated with the competition. Requires the competition ID to be present in the request parameters (:id in path). Only use after requireAuth middleware.
 * @param authRepo
 * @returns
 */
export const requireCourseMember = (
	competitionRepo: CompetitionRepo,
	authRepo: AuthentificationRepo,
) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const user = req.user as DatabaseUser;
    if (!user) {
			return res
				.status(400)
				.json({
					message: "Missing user information",
				});
		}

    let courseId: number | null = null;
    // check if courseIs provided in request params, if not, check if competitionId is provided and get the courseId from the competition
    if (req.params.courseId) {
      courseId = Number(req.params.courseId);
		} else if (req.params.id || req.params.competitionId) {
      const competitionId = Number(req.params.id || req.params.competitionId);
      const competition = await competitionRepo.getById(competitionId);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      courseId = competition.courseId;
    }

    if(!courseId || isNaN(courseId)) {
      return res.status(400).json({ message: "No valid courseId could be resolved from the request parameters" });
    }

		const isMemberOfCourse = await authRepo.userIsInCourse(
				user.id,
				courseId,
			);
		
		if (!isMemberOfCourse) {
			return res.status(403).json({
				message:
					"User is not a member of the course associated with this competition",
			});
		}

    (req as any).courseId = courseId; // Attach the courseId to the request object for further use
		next();
	};
};

export const requireAdmin = () => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const user = req.user as DatabaseUser;
		if (!user) {
			return res
				.status(400)
				.json({ message: "Missing user information" });
		}

		if (user.userRole !== "ADMIN") {
			return res.status(403).json({ message: "User is not an admin" });
		}
		next();
	};
};
