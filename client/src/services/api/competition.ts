import {
	Competition,
	CompetitionSubmission,
	DatasetMetadata,
	DatasetType,
	LeaderboardEntry,
	PaginationResult,
} from "@/types/competition.models";
import ApiClient from "./client";

export const COMPETITION_ENDPOINT_ADDITION = "/competition/competitions";

const competitionApi = {
	getCompetitionById: async (competitionId: number): Promise<Competition | null> => {
		return await ApiClient.getInstance().get<Competition>(
			`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}`,
			undefined,
			true,
		);
	},

	getCompetitionByCourse: async (courseId: number): Promise<Competition | null> => {
		return await ApiClient.getInstance().get<Competition>(
			`${COMPETITION_ENDPOINT_ADDITION}/course/${courseId}`,
			undefined,
			true,
		);
	},

	createCompetition: async (body: {
		name: string;
		description: string;
		courseId: number;
		start_date: string;
		end_date: string;
	}): Promise<Competition | null> => {
		return await ApiClient.getInstance().post<Competition>(COMPETITION_ENDPOINT_ADDITION, body, true);
	},

	updateCompetition: async (
		competitionId: number,
		body: {
			name: string;
			description: string;
			start_date: string;
			end_date: string;
		},
	): Promise<Competition | null> => {
		return await ApiClient.getInstance().put<Competition>(`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}`, body, true);
	},

	downloadDataset: async (competitionId: number, datasetId: number) => {
		const blob = await ApiClient.getInstance().getBlob(
			`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}/datasets/${datasetId}/download`,
			undefined,
			true,
		);
		return blob;
	},

	getDatasetsMetadataForCompetition: async (competitionId: number, type?: DatasetType, round?: number) => {
		const params: Record<string, string | number> = {};
		if (type !== undefined) params.type = String(type);
		if (round !== undefined) params.round = round;
		
		return await ApiClient.getInstance().get<DatasetMetadata[]>(
			`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}/datasets`,
			params,
			true,
		);
	},

	uploadTrainingDataset: async (competitionId: number, file: File) => {
		const formData = new FormData();
		formData.append("dataset", file);

		return await ApiClient.getInstance().post<CompetitionSubmission>(
			`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}/datasets/train`,
			formData,
			true,
		);
	},

	uploadRoundDatasets: async (competitionId: number, round: number, inputFile: File, groundTruthFile: File) => {
		const formData = new FormData();
		formData.append("inputFile", inputFile);
		formData.append("groundTruthFile", groundTruthFile);

		return await ApiClient.getInstance().post(
			`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}/datasets/rounds/${round}`,
			formData,
			true,
		);
	},

	deleteDataset: async (competitionId: number, datasetId: number) => {
		return await ApiClient.getInstance().delete(
			`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}/datasets/${datasetId}`,
			true,
		);
	},

	submitCompetitionSubmission: async (competitionId: number, submissionLink: string, pseudonym: string) => {
		return await ApiClient.getInstance().put<CompetitionSubmission>(
			`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}/submissions`,
			{ apiUrl: submissionLink, pseudonym: pseudonym },
			true,
		);
	},

	getMySubmission: async (competitionId: number) => {
		return await ApiClient.getInstance().get<CompetitionSubmission>(
			`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}/submissions/me`,
			undefined,
			true,
		);
	},

	getLeaderboard: async (competitionId: number, page: number, limit: number) => {
		return await ApiClient.getInstance().get<PaginationResult<LeaderboardEntry>>(
			`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}/leaderboard`,
			{ page, limit },
			true,
		);
	},

	getFinishedRounds: async (competitionId: number) => {
		return await ApiClient.getInstance().get<number[]>(
			`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}/leaderboard/rounds`,
			undefined,
			true,
		);
	},

	getLeaderboardForRound: async (competitionId: number, round: number, page: number, limit: number) => {
		return await ApiClient.getInstance().get<PaginationResult<LeaderboardEntry>>(
			`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}/leaderboard/rounds/${round}`,
			{ page, limit },
			true,
		);
	},
};

export default competitionApi;
