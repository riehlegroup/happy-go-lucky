import { Request, Response, NextFunction } from "express";
import { AuthentificationRepo } from "../repositories/authentification.repository";
import jwt from "jsonwebtoken";
import { DatabaseUser } from "../types/user.types";
import { CompetitionService } from "../services/competition.service";
import { Competition } from "../types/competition.types";
import { errorResponse, handleError } from "../errors/errorhandling.helper";

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
			return errorResponse("No token provided", 401, res);
		}
		const token = authHeader.split(" ")[1];
		try {
			const decoded = jwt.verify(token, secretKey) as {
				id: string;
				email: string;
			};
			const userFromTokenId: DatabaseUser | undefined = await authRepo.getById(Number(decoded.id));
			if (!userFromTokenId) {
				return errorResponse("User with token userId not found", 401, res);
			}
			req.user = userFromTokenId; // Attach the user to the request object for further use
		} catch (error) {
			handleError(error, "Invalid token", res);
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
		const courseId = req.params.courseId ? Number(req.params.courseId) : undefined; // Takes the competition ID from the path parameter

		if (isNaN(competitionId) && (courseId === undefined || isNaN(courseId))) {
			return errorResponse("Missing competition ID", 400, res);
		}

		try {
			let competition: Competition | undefined;
			if (competitionId) {
				competition = await competitionService.getCompetitionById(competitionId);
			} else if (courseId) {
        competition = await competitionService.getCompetitionByCourseId(courseId);
      }
			if (!competition) {
				return errorResponse("Competition not found", 404, res);
			}
			req.competition = competition; // Attach the competition to the request object for further use
		} catch (error) {
			handleError(error, "Failed to check competition existence", res);
			return;
		}
		next();
	};
};

/**
 * middleware to check if the user is a member of the course associated with the competition (admin is always allowed). Only use after requireAuth and requireCompetitionExists middleware.
 * @param authRepo to check if the user is a member of the course associated with the competition.
 * @param courseId optional courseId to check if the user is a member of the course. If not provided, it will be taken from the competition attached to the request object by the requireCompetitionExists middleware.
 * @returns
 */
export const requireCourseMember = (authRepo: AuthentificationRepo) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const user = req.user as DatabaseUser;
		const competition = req.competition as Competition; // Takes the competition from the previous middleware
		const courseId = req.params.courseId ? Number(req.params.courseId) : undefined;

		if (!user) {
			return errorResponse("Missing user information", 400, res);
		}
		let isMemberOfCourse: boolean;

		if (competition?.courseId) {
			isMemberOfCourse = await authRepo.userIsInCourse(user.id, competition.courseId);
		} else if (courseId) {
			isMemberOfCourse = await authRepo.userIsInCourse(user.id, courseId);
		} else {
			return errorResponse("Missing course information", 400, res);
		}

		if (!isMemberOfCourse && user.userRole !== "ADMIN") {
			return errorResponse("User is not a member of the course associated with this competition", 403, res);
		}
		next();
	};
};

export const requireAdmin = () => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const user = req.user as DatabaseUser;
		if (!user) {
			return errorResponse("Missing user information", 400, res);
		}

		if (user.userRole !== "ADMIN") {
			return errorResponse("User is not an admin", 403, res);
		}
		next();
	};
};

/**middleware to check if the competition is active (between start and end date). Competition exists must be used before this middleware. Admins are always allowed. */
export const requireCompetitionActive = () => {
	return async (req: Request, res: Response, next: NextFunction) => {
		// competition and user from previous middleware
		const user = req.user as DatabaseUser;
		const competition = req.competition as Competition;

		if (!competition || !user) {
			return errorResponse("Missing competition or user information", 400, res);
		}

		const now = new Date();
		const startDate = new Date(competition.startDate);
		const endDate = new Date(competition.endDate);

		if (now < startDate || now > endDate) {
			if (user.userRole !== "ADMIN") {
				return errorResponse("Competition is not active", 403, res);
			}
		}
		next();
	};
};
