export interface Competition {
  id: number;
  name: string;
  description: string;
  courseId: number;
  startDate: string;
  endDate: string;
}

export enum DatasetType {
    TRAIN = "TRAIN",
    TEST = "TEST",
    VALIDATION = "VALIDATION",
}

export interface CompetitionSubmission {
    id: number;
    competitionId: number;
    userId: number;
    apiUrl: string;
    createdAt: string;
    updatedAt: string;
}