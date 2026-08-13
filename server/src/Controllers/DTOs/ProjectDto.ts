import { CourseFeature } from "../../Models/CourseFeature";

export interface ProjectDto {
    id: number;
    projectName: string;
    courseId: number;
    enabledFeatures?: CourseFeature[];
}