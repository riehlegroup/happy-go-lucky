import { NotFoundException } from "../errors/notfound.error";
import { LeaderboardRepo } from "../repositories/leaderboard.repository";
import {
	LeaderboardEntry,
	LeaderboardResponseDto,
	PaginatedResult,
	PaginationDatabaseResult,
	PaginationQuery,
	RoundResultForUserDto,
} from "../types/competition.types";

export class LeaderboardService {
	constructor(private leaderboardRepo: LeaderboardRepo) {}

	async getPaginatedLeaderboardForRound(
		competitionId: number,
		round: number,
		pagination: PaginationQuery,
	): Promise<PaginatedResult<LeaderboardResponseDto>> {
		const page: PaginationDatabaseResult<LeaderboardEntry> = await this.leaderboardRepo.getPaginatedLeaderboardForRound(
			competitionId,
			round,
			pagination,
		);
		const { data, totalItems } = page;
		const totalPages = Math.ceil(totalItems / pagination.limit);
		const hasNextPage = page.data.length > 0 && pagination.page < totalPages;
		const hasPrevPage = pagination.page > 1;

		// Add rank to each entry based on the current page and limit
		const rankedData: LeaderboardResponseDto[] = data.map((entry, index) => ({
			...entry,
			rank: (pagination.page - 1) * pagination.limit + index + 1,
		}));

		return {
			data: rankedData,
			pagination: {
				page: pagination.page,
				limit: pagination.limit,
				totalItems,
				totalPages,
				hasNextPage,
				hasPrevPage,
			},
		};
	}

	async getAllRoundResultsForUser(competitionId: number, userId: number): Promise<RoundResultForUserDto[]> {
		const results = await this.leaderboardRepo.getAllRoundResultsForUser(competitionId, userId);
		if (!results || results.length === 0) {
			throw new NotFoundException(
				`No round results found for user with ID ${userId} in competition with ID ${competitionId}`,
			);
		}
		return results;
	}

	async getPaginatedLeaderboardForAllFinishedRounds(
		competitionId: number,
		pagination: PaginationQuery,
	): Promise<PaginatedResult<LeaderboardResponseDto>> {
		const page: PaginationDatabaseResult<LeaderboardEntry> =
			await this.leaderboardRepo.getPaginatedLeaderboardForAllFinishedRounds(competitionId, pagination);
		const { data, totalItems } = page;
		const totalPages = Math.ceil(totalItems / pagination.limit);
		const hasNextPage = page.data.length > 0 && pagination.page < totalPages;
		const hasPrevPage = pagination.page > 1;

		// Add rank to each entry based on the current page and limit
		const rankedData: LeaderboardResponseDto[] = data.map((entry, index) => ({
			...entry,
			rank: (pagination.page - 1) * pagination.limit + index + 1,
		}));

		return {
			data: rankedData,
			pagination: {
				page: pagination.page,
				limit: pagination.limit,
				totalItems,
				totalPages,
				hasNextPage,
				hasPrevPage,
			},
		};
	}

	async getFinishedRounds(competitionId: number): Promise<number[]> {
		return await this.leaderboardRepo.getEvaluatedRounds(competitionId);
	}
}
