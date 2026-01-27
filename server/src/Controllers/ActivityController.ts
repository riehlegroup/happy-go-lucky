import { Application, Request, Response } from "express";
import { Database } from "sqlite";
import { DatabaseHelpers } from "../Models/DatabaseHelpers";
import { IAppController } from "./IAppController";
import { Activity, ActivityFactory } from "../Models/Activity";

/**
 * Activity Types - All possible activities that can be tracked
 */
export enum ActivityType {
    STANDUP_SUBMITTED = "standup_submitted",      // When a user submits a standup
    HAPPINESS_SUBMITTED = "happiness_submitted",  // When a user logs happiness level
    USER_JOINED = "user_joined",                  // When a user joins a project
    USER_LEFT = "user_left",                      // When a user leaves a project
    PROJECT_CREATED = "project_created",          // When a new project is created
    PROJECT_UPDATED = "project_updated",          // When project settings change
}

/**
 * Activity Data Structure
 */
export interface ProjectActivity {
    id: number;
    projectId: number;
    userId: number;
    userName: string;
    userEmail: string;
    activityType: ActivityType;
    activityData: string | null;  // JSON string with extra data (e.g., happiness level)
    timestamp: string;
}

/**
 * Type guard to validate ActivityType
 * 
 * @param value - The value to check
 * @returns True if value is a valid ActivityType
 */
const isValidActivityType = (value: any): value is ActivityType => {
    return Object.values(ActivityType).includes(value);
};

/**
 * ActivityController
 * 
 * Manages project activity tracking and retrieval.
 * Provides API endpoints to:
 * - Get activities for a project (timeline view)
 * - Log new activities (called by other controllers)
 */
export class ActivityController implements IAppController {
    constructor(private db: Database) { }

    /**
     * Register API routes
     */
    init(app: Application): void {
        app.get("/project/activities", this.getProjectActivities.bind(this));
        app.post("/project/activity", this.logActivity.bind(this));
    }

    /**
     * GET /project/activities?projectName=<name>&limit=<number>
     * 
     * Fetches recent activities for a specific project
     * Returns activities sorted by most recent first
     */
    async getProjectActivities(req: Request, res: Response): Promise<void> {
        const { projectName, limit = "50" } = req.query;

        // Validate input
        if (!projectName) {
            res.status(400).json({ message: "Project name is required" });
            return;
        }

        // Validate and parse limit parameter
        const parsedLimit = parseInt(limit.toString(), 10);
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            res.status(400).json({ message: "Limit must be a positive integer" });
            return;
        }

        try {
            // Get project ID from name
            const projectId = await DatabaseHelpers.getProjectIdFromName(
                this.db,
                projectName.toString()
            );

            // Fetch activities with user details
            const activities = await this.db.all<ProjectActivity[]>(
                `SELECT 
          pa.id,
          pa.projectId,
          pa.userId,
          u.name as userName,
          u.email as userEmail,
          pa.activityType,
          pa.activityData,
          pa.timestamp
        FROM project_activities pa
        JOIN users u ON pa.userId = u.id
        WHERE pa.projectId = ?
        ORDER BY pa.timestamp DESC
        LIMIT ?`,
                [projectId, parsedLimit]
            );

            res.json(activities);
        } catch (error) {
            console.error("Error fetching project activities:", error);
            res.status(500).json({
                message: "Failed to retrieve project activities",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    /**
     * POST /project/activity
     * Body: { projectName, userEmail, activityType, activityData? }
     * 
     * Logs a new activity for a project
     */
    async logActivity(req: Request, res: Response): Promise<void> {
        const { projectName, userEmail, activityType, activityData } = req.body;

        // Validate required fields
        if (!projectName || !userEmail || !activityType) {
            res.status(400).json({
                message: "Project name, user email, and activity type are required"
            });
            return;
        }

        // Validate activity type using type guard
        if (!isValidActivityType(activityType)) {
            res.status(400).json({ message: "Invalid activity type" });
            return;
        }

        try {
            // Create and validate activity using the Activity class
            const activity = ActivityFactory.create(activityType, activityData);
            const activityDataStr = activity.getActivityData();

            // Get IDs from names/emails
            const projectId = await DatabaseHelpers.getProjectIdFromName(
                this.db,
                projectName
            );
            const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail);

            // Insert activity into database
            await this.db.run(
                `INSERT INTO project_activities (projectId, userId, activityType, activityData)
         VALUES (?, ?, ?, ?)`,
                [projectId, userId, activityType, activityDataStr]
            );

            res.status(201).json({ message: "Activity logged successfully" });
        } catch (error) {
            console.error("Error logging activity:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            const statusCode = errorMessage.includes("Invalid") ? 400 : 500;
            res.status(statusCode).json({
                message: "Failed to log activity",
                error: errorMessage
            });
        }
    }

    /**
     * Helper method for other controllers to log activities
     * 
     * Usage example:
     * await ActivityController.logActivityHelper(
     *   db, 
     *   "My Project", 
     *   "user@example.com", 
     *   ActivityType.STANDUP_SUBMITTED
     * );
     */
    static async logActivityHelper(
        db: Database,
        projectName: string,
        userEmail: string,
        activityType: ActivityType,
        activityData?: any
    ): Promise<void> {
        try {
            // Create and validate activity using the Activity class
            const activity = ActivityFactory.create(activityType, activityData);
            const activityDataStr = activity.getActivityData();

            // Get IDs
            const projectId = await DatabaseHelpers.getProjectIdFromName(db, projectName);
            const userId = await DatabaseHelpers.getUserIdFromEmail(db, userEmail);

            // Insert activity
            await db.run(
                `INSERT INTO project_activities (projectId, userId, activityType, activityData)
         VALUES (?, ?, ?, ?)`,
                [projectId, userId, activityType, activityDataStr]
            );
        } catch (error) {
            // Don't throw - activity logging should never break main functionality
            console.error("Failed to log activity:", error);
        }
    }
}
