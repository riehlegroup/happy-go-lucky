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