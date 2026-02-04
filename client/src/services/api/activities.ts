import ApiClient from "./client";

export enum ActivityType {
    STANDUP_SUBMITTED = "standup_submitted",
    HAPPINESS_SUBMITTED = "happiness_submitted",
    USER_JOINED = "user_joined",
    USER_LEFT = "user_left",
    PROJECT_CREATED = "project_created",
    PROJECT_UPDATED = "project_updated",
}

/**
 * Project Activity Interface
 * Represents a single activity in a project timeline
 */
export interface ProjectActivity {
    id: number;
    projectId: number;
    userId: number;
    userName: string;
    userEmail: string;
    activityType: ActivityType;
    activityData: string | null;  // JSON string with extra info
    timestamp: string;
}

/**
 * Activities API Service
 * 
 * Handles all API calls related to project activities
 */
class ActivitiesApi {
    private client = ApiClient.getInstance();

    /**
     * Get recent activities for a project
     * 
     * @param projectName - Name of the project
     * @param limit - Maximum number of activities to fetch (default: 50)
     * @returns Array of activities, sorted by most recent first
     */
    async getProjectActivities(projectName: string, limit = 50): Promise<ProjectActivity[]> {
        return this.client.get<ProjectActivity[]>("/project/activities", {
            projectName,
            limit: limit.toString(),
        });
    }

    /**
     * Log a new activity
     * 
     * @param projectName - Name of the project
     * @param userEmail - Email of the user performing the activity
     * @param activityType - Type of activity (e.g., "standup_submitted")
     * @param activityData - Optional extra data (e.g., { happiness: 4 })
     */
    async logActivity(
        projectName: string,
        userEmail: string,
        activityType: ActivityType,
        activityData?: unknown
    ): Promise<void> {
        return this.client.post("/project/activity", {
            projectName,
            userEmail,
            activityType,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            activityData: activityData as any,
        });
    }
}

// Export singleton instance
export default new ActivitiesApi();
