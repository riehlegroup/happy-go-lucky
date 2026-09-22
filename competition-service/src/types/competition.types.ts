import { z } from "zod";
/**
 * Database model for a competition
 */
export interface Competition {
	id: number;
	name: string;
	courseId: number;
	evaluation_config_id: number;
	description: string;
	startDate: Date;
	endDate: Date;
}

/**
 * validation Schema for creating a competition
 */
export const CreateCompetitionSchema = z.object({
	name: z.string().min(3, "name must be at least 3 characters long"),
	courseId: z.number().int().positive(),
	description: z.string().min(20, "description must be at least 20 characters long"),
	start_date: z.iso.date(),
	end_date: z.iso.date(),
});
/**
 * DTO for creating a competition
 */
export type CreateCompetitionDto = z.infer<typeof CreateCompetitionSchema>;

export const UpdateCompetitionSchema = CreateCompetitionSchema.omit({ courseId: true });
/**
 * DTO for updating a competition
 */
export type UpdateCompetitionDto = z.infer<typeof UpdateCompetitionSchema>;

/**
 * DTO for Response when fetching competitions
 */
export interface CompetitionResponseDto {
	id: number;
	name: string;
	courseId: number;
	description: string;
	isActive: boolean;
}

export const SubmissionInboundDtoSchema = z.object({
	apiUrl: z.url("apiUrl must be a valid URL"),
});

/**
 * Inbound DTO for a competition submission
 */
export type SubmissionInboundDto = z.infer<typeof SubmissionInboundDtoSchema>;

/**
 * Database model for a competition submission
 */
export interface Submission {
	id: number;
	competitionId: number;
	userId: number;
	apiUrl: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Database model for a dataset associated with a competition
 */
export interface Dataset {
	id: number;
	competitionId: number;
	dataset_type: DatasetType;
	file_name: string;
	file_path: string;
}

export enum DatasetType {
	TRAIN = "TRAIN",
	TEST = "TEST",
	VALIDATION = "VALIDATION",
}
/**
 * Validation schema for dataset type
 */
export const datasetTypeSchema = z.object({
	type: z.enum(DatasetType),
});

export const DatasetResponseSchema = z.object({
	id: z.number(),
	competitionId: z.number(),
	dataset_type: z.enum(DatasetType),
	file_name: z.string(),
});

export type DatasetResponseDto = z.infer<typeof DatasetResponseSchema>;

export interface Evaluation {
	id: number;
	submissionId: number;
	token: string | null; // Token for users to download test data and submit predictions for evaluation
	score: number | null;
	detailed_scores: string | null; // JSON of detailed scores
	error_message: string | null;
  created_at: string;
	completed_at: string | null;
	started_at: string;
	inference_time_ms: number | null;
	status: EvaluationStatus;
	prediction: string | null; // JSON of raw prediction
}
export interface UpdateEvaluationDto {
  status?: EvaluationStatus | null;
  score?: number | null;
  detailed_scores?: string | null;
  started_at?: Date | string | null;
  inference_time_ms?: number | null;
  error_message?: string | null;
  prediction?: string | null;
  completed_at?: Date | string | null;
}

export enum EvaluationStatus {
	PENDING = "PENDING",
	EVALUATED = "EVALUATED",
	FAILED = "FAILED",
	DELAYED = "DELAYED",
}

export interface EvaluationConfig {
	id: number;
	name: string;
	input_column_names: string[];
	target_columns: EvaluationTarget[];
}

export interface EvaluationTarget {
	target_column_name: string;
	evaluation_metric: EvaluationMetric;
}

export enum EvaluationMetric {
	// TODO mit echten Metriken erweitern, die für die Evaluation von ML Modellen relevant sind
	ACCURACY = "ACCURACY",
	PRECISION = "PRECISION",
	RECALL = "RECALL",
	F1 = "F1",
}
