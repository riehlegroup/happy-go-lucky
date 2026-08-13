/**
 * This class offers typing for return values from db methods that are 
 * used with DatabaseReader
 */

export type ResultSet = ResultRow | ResultRow[];

export type ResultRow = UserResult | CourseProjectResult | CourseResult;

export interface UserResult {
    id: number;
    name: string | null;
    githubUsername: string | null;
    email: string | null;
    status: string;
    password: string | null;
    resetPasswordToken: string | null;
    resetPasswordExpire: number | null;
    confirmEmailToken: string | null;
    confirmEmailExpire: number | null;
    userRole: string;
}

export interface CourseProjectResult {
    id: number;
    projectName: string | null;
    courseId: number | null;
}

export interface CourseResult {
    id: number;
    semester: string | null;
    courseName: string | null;
}