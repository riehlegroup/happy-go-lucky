import ApiClient from "./client";

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
    activityType: string;  // e.g., "standup_submitted", "happiness_submitted"
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
        activityType: string,
        activityData?: any
    ): Promise<void> {
        return this.client.post("/project/activity", {
            projectName,
            userEmail,
            activityType,
            activityData,
        });
    }
}

// Export singleton instance
export default new ActivitiesApi();
