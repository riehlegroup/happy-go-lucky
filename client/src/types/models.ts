/**
 * Domain model type definitions used across the application
 */

import { CourseFeature } from "./CourseFeature";

export interface User {
  id: number;
  email: string;
  name: string;
  userRole: string;
  userStatus: string;
  githubUsername?: string;
}

export interface Course {
  id: number;
  semester: string;
  courseName: string;
  projects: Project[];
  studentsCanCreateProject: boolean;
}

export interface Project {
  id: number;
  projectName: string;
  courseId: number;
  studentsCanJoinProject: boolean;
}

export interface ProjectDto {
  id: number;
  projectName: string;
  courseId: number;
  enabledFeatures?: CourseFeature[];
}

export interface CourseSchedule {
  id: number;
  startDate: string;
  endDate: string;
  submissionDates: string[];
}

export interface Sprint {
  id: number;
  projectId: number;
  sprintEndDate: string;
}

export interface HappinessRating {
  id?: number;
  userId: number;
  projectId: number;
  sprintId: number;
  rating: number;
  timestamp?: string;
}

export interface StandupEmail {
  projectName: string;
  userName: string;
  doneText: string;
  plansText: string;
  challengesText: string;
  [key: string]: string;
}

export interface UserProject {
  userId: number;
  projectId: number;
}
