import { z } from "zod";
/**
 * Database model for a competition
 */
export interface Competition {
	id: number;
	name: string;
	courseId: number;
	description: string;
	startDate: Date;
	endDate: Date;
}

/**
 * validation Schema for creating a competition
 */
export const CreateCompetitionSchema = z.object({
	name: z.string().min(3, "Name muss mindestens 3 Zeichen lang sein"),
	courseId: z.number().int().positive(),
	description: z
		.string()
		.min(10, "Beschreibung muss mindestens 10 Zeichen lang sein"),
	start_date: z.iso.datetime(),
	end_date: z.iso.datetime(),
});
/**
 * DTO for creating a competition
 */
export type CreateCompetitionDto = z.infer<typeof CreateCompetitionSchema>;

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
 * Validation schema for uploading a dataset
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
