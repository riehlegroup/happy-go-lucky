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

export const SubmissionInboundDtoSchema = z.object({
  competitionId: z.number().int().positive(),
  userId: z.number().int().positive(),
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


