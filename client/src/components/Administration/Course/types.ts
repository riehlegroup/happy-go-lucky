import { CourseFeature } from "@/types/CourseFeature";

//TODO: Why is there a types.ts file in the course administration folder? This should be removed and the Course and Project interfaces should be imported from the models.ts file instead.
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
