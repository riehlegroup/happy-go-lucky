import competitionApi from "@/services/api/competition";
import { LeaderboardEntry, PaginationResult } from "@/types/competition.models";
import { useEffect, useState } from "react";

function extractErrorMessage(error: unknown, defaultMessage: string): string {
	if (error instanceof Error) {
		return error.message;
	}
	return defaultMessage;
}

export const useLeaderboard = (competitionId: number, round: number | null, page: number = 1, limit: number = 25) => {
	const [leaderboardData, setLeaderboardData] = useState<PaginationResult<LeaderboardEntry>>({
		data: [],
		pagination: {
			page: 1,
			limit: 10,
			totalItems: 0,
			totalPages: 0,
			hasNextPage: false,
			hasPrevPage: false,
		},
	});
	const [rounds, setRounds] = useState<number[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// fetch rounds and paginated leaderboard data when competitionId, round, page or limit changes
	useEffect(() => {
		getFinishedRounds();
        if (round) {
            getLeaderboardForRound(round, page, limit);
        } else {
            getLeaderboardData(page, limit);
        }
	}, [competitionId, round, page, limit]);

	const getFinishedRounds = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await competitionApi.getFinishedRounds(competitionId);
			setRounds(result);
		} catch (error) {
			setError(extractErrorMessage(error, "Failed to fetch finished rounds"));
		} finally {
			setIsLoading(false);
		}
	};

	const getLeaderboardData = async (pageNumber: number, limit: number) => {
		setIsLoading(true);
		setError(null);
		try {
			const page = await competitionApi.getLeaderboard(competitionId, pageNumber, limit);
			setLeaderboardData(page);
		} catch (error) {
			setError(extractErrorMessage(error, "Failed to fetch leaderboard data"));
		} finally {
			setIsLoading(false);
		}
	};

	const getLeaderboardForRound = async (round: number, pageNumber: number, limit: number) => {
		setIsLoading(true);
		setError(null);
		try {
			const page = await competitionApi.getLeaderboardForRound(competitionId, round, pageNumber, limit);
			setLeaderboardData(page);
		} catch (error) {
			setError(extractErrorMessage(error, "Failed to fetch leaderboard for round"));
		} finally {
			setIsLoading(false);
		}
	};

	return {leaderboardData, rounds, isLoading, error};
};
