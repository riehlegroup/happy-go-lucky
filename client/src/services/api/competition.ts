import { Competition, CompetitionSubmission, DatasetType } from "@/types/competition.models";
import ApiClient from "./client";

export const COMPETITION_ENDPOINT_ADDITION = "/competition/competitions";

const competitionApi = {
	getCompetitionById: async (competitionId: number): Promise<Competition | null> => {
			return await ApiClient.getInstance().get<Competition>(
				`{COMPETITON_ENDPOINT_ADDITION}/${competitionId}`,
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
			return await ApiClient.getInstance().post<Competition>(
				COMPETITION_ENDPOINT_ADDITION,
				body,
				true,
			);
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
			return await ApiClient.getInstance().put<Competition>(
				`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}`,
				body,
				true,
			);
		
	},

	downloadDatasetByType: async (competitionId: number, datasetType: DatasetType) => {
			const blob = await ApiClient.getInstance().getBlob(
				`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}/datasets`,
				{ type: datasetType },
				true,
			);
			return blob;
	},

	uploadDataset: async (competitionId: number, datasetType: DatasetType, file: File) => {
		const formData = new FormData();
		formData.append("dataset", file);
		formData.append("type", datasetType);

			return await ApiClient.getInstance().post<CompetitionSubmission>(
				`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}/dataset`,
				formData,
				true,
			);
	},

	submitCompetitionSubmission: async (competitionId: number, submissionLink: string) => {
			return await ApiClient.getInstance().put<CompetitionSubmission>(
				`${COMPETITION_ENDPOINT_ADDITION}/${competitionId}/submissions`,
				{ apiUrl: submissionLink },
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
};

export default competitionApi;
