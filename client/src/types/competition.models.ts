export interface Competition {
	id: number;
	name: string;
	description: string;
	courseId: number;
	start_date: string;
	end_date: string;
}

export interface CreateCompetitionDto {
	name: string;
	description: string;
	start_date: string;
	end_date: string;
}

export enum DatasetType {
	TRAIN = "TRAIN",
	TEST = "TEST",
	VALIDATION = "VALIDATION",
}

export interface DatasetMetadata {
	id: number;
	competitionId: number;
	type: DatasetType;
	filename: string;
	createdAt: string;
	updatedAt: string;
}

export interface CompetitionSubmission {
	id: number;
	competitionId: number;
	userId: number;
	apiUrl: string;
	createdAt: string;
	updatedAt: string;
}
