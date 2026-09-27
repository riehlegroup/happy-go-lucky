import { errorResponse, handleError } from "../errors/errorhandling.helper";
import { LeaderboardService } from "../services/leaderboard.service";
import { Competition, PaginationQuerySchema } from "../types/competition.types";

export class LeaderboardController {
	constructor(private leaderboardService: LeaderboardService) {}

	async getLeaderboardForRound(req: any, res: any) {
		try {
			const competition: Competition = req.competition;
			const round: number | null = req.query.round ? parseInt(req.query.round, 10) : null;
			const pagination = PaginationQuerySchema.parse(req.query);

			if (!competition) {
				return errorResponse("Competition not found in request", 400, res);
			}
			if (!round || isNaN(round) || round < 1) {
				return errorResponse("Query parameter 'round' is not present or invalid", 400, res);
			}

			const paginatedResult = await this.leaderboardService.getPaginatedLeaderboardForRound(
				competition.id,
				round,
				pagination,
			);

			res.status(200).json(paginatedResult);
		} catch (error) {
			handleError(error, "Failed to retrieve leaderboard", res);
		}
	}

	async getLeaderboardForAllFinishedRounds(req: any, res: any) {
		try {
			const competition: Competition = req.competition;
			if (!competition) {
				return errorResponse("Competition not found in request", 400, res);
			}

			const pagination = PaginationQuerySchema.parse(req.query);
			const paginatedLeaderboard = await this.leaderboardService.getPaginatedLeaderboardForAllFinishedRounds(
				competition.id,
				pagination,
			);

			res.status(200).json(paginatedLeaderboard);
		} catch (error) {
			handleError(error, "Failed to retrieve leaderboard for all finished rounds", res);
		}
	}

	async getAllRoundResultsForUser(req: any, res: any) {
		try {
			const userId = req.user?.id;
			const competition: Competition = req.competition;

			if (!userId) {
				return errorResponse("User ID not found in request", 400, res);
			}
			if (!competition) {
				return errorResponse("Competition not found in request", 400, res);
			}

			const results = await this.leaderboardService.getAllRoundResultsForUser(competition.id, userId);
			res.status(200).json(results);
		} catch (error) {
			handleError(error, "Failed to retrieve all round results for user", res);
		}
	}
}
