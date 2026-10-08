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
	INPUT = "INPUT",
	GROUND_TRUTH = "GROUND_TRUTH",
}

export interface DatasetMetadata {
	id: number;
	competitionId: number;
	round: number | null;
	dataset_type: DatasetType;
	file_name: string;
}

export interface CompetitionSubmission {
	id: number;
	competitionId: number;
	pseudonym: string;
	userId: number;
	apiUrl: string;
	createdAt: string;
	updatedAt: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface LeaderboardEntry{
  rank: number;
  pseudonym: string;
  score: number;
  inference_time_ms: number | null;
  completed_at: string | null;
}
