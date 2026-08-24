import { CourseFeature } from "@/types/CourseFeature";

//TODO: Check if this seperate types file is necessary or if it can be merged with the competition.types.ts file.
export interface Course {
  id: number;
  termId: number;
  courseName: string;
  projects: Project[];
  studentsCanCreateProject: boolean;
  enabledFeatures: CourseFeature[];
}

export interface Project {
  id: number;
  projectName: string;
  courseId: number;
  studentsCanJoinProject: boolean;
}
