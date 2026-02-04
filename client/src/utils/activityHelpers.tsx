import { ActivityType, ProjectActivity } from "@/services/api/activities";
import { Clock, Users, Smile, MessageSquare } from "lucide-react";

/**
 * Get the appropriate icon component for each activity type
 * 
 * @param activityType - The type of activity
 * @returns JSX element representing the icon
 */
export const getActivityIcon = (activityType: ActivityType) => {
    switch (activityType) {
        case ActivityType.STANDUP_SUBMITTED:
            return <MessageSquare className="size-5 text-blue-500" />;
        case ActivityType.HAPPINESS_SUBMITTED:
            return <Smile className="size-5 text-yellow-500" />;
        case ActivityType.USER_JOINED:
            return <Users className="size-5 text-green-500" />;
        case ActivityType.USER_LEFT:
            return <Users className="size-5 text-red-500" />;
        case ActivityType.PROJECT_CREATED:
            return <Users className="size-5 text-indigo-500" />;
        case ActivityType.PROJECT_UPDATED:
            return <MessageSquare className="size-5 text-purple-500" />;
        default:
            return <Clock className="size-5 text-gray-500" />;
    }
};

/**
 * Generate human-readable text for each activity
 * 
 * @param activity - The activity object
 * @returns Formatted activity description string
 * @throws Will not throw but logs if JSON parsing fails
 */
export const getActivityText = (activity: ProjectActivity): string => {
    // Parse additional data if available
    let activityData: Record<string, unknown> | null = null;

    if (activity.activityData) {
        try {
            activityData = JSON.parse(activity.activityData);
        } catch (e) {
            console.error("Failed to parse activityData JSON:", e, activity.activityData);
            activityData = null;
        }
    }

    switch (activity.activityType) {
        case ActivityType.STANDUP_SUBMITTED:
            return `submitted a standup update`;

        case ActivityType.HAPPINESS_SUBMITTED: {
            const happiness = activityData?.happiness as number;
            const emoji = happiness >= 4 ? "😊" : happiness >= 3 ? "😐" : "😟";
            return `submitted happiness level ${emoji}`;
        }

        case ActivityType.USER_JOINED: {
            const role = activityData?.role as string | undefined;
            return role ? `joined the project as ${role}` : "joined the project";
        }

        case ActivityType.USER_LEFT:
            return `left the project`;

        case ActivityType.PROJECT_CREATED: {
            const projectName = activityData?.name as string | undefined;
            const courseName = activityData?.courseName as string | undefined;
            if (projectName && courseName) {
                return `created project "${projectName}" in course "${courseName}"`;
            }
            return "created a project";
        }

        case ActivityType.PROJECT_UPDATED: {
            const changes = activityData && typeof activityData === "object"
                ? Object.keys(activityData)
                : [];
            if (changes.length > 0) {
                return `updated project settings: ${changes.join(", ")}`;
            }
            return "updated project settings";
        }

        default:
            return `performed an action`;
    }
};

/**
 * Format timestamp to human-readable relative time
 * Examples: "2 hours ago", "yesterday", "Jan 15"
 * 
 * @param timestamp - ISO date string
 * @returns Formatted relative time string
 */
export const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Recent activities
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    // Older activities - show date
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
};
