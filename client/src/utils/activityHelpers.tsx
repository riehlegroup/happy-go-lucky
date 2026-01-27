import { ProjectActivity } from "@/services/api/activities";
import { Clock, Users, Smile, MessageSquare } from "lucide-react";

/**
 * Get the appropriate icon component for each activity type
 * 
 * @param activityType - The type of activity
 * @returns JSX element representing the icon
 */
export const getActivityIcon = (activityType: string) => {
    switch (activityType) {
        case "standup_submitted":
            return <MessageSquare className="h-5 w-5 text-blue-500" />;
        case "happiness_submitted":
            return <Smile className="h-5 w-5 text-yellow-500" />;
        case "user_joined":
            return <Users className="h-5 w-5 text-green-500" />;
        case "user_left":
            return <Users className="h-5 w-5 text-red-500" />;
        default:
            return <Clock className="h-5 w-5 text-gray-500" />;
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
    let activityData: any = null;

    if (activity.activityData) {
        try {
            activityData = JSON.parse(activity.activityData);
        } catch (e) {
            console.error("Failed to parse activityData JSON:", e, activity.activityData);
            activityData = null;
        }
    }

    switch (activity.activityType) {
        case "standup_submitted":
            return `submitted a standup update`;

        case "happiness_submitted":
            const happiness = activityData?.happiness;
            const emoji = happiness >= 4 ? "😊" : happiness >= 3 ? "😐" : "😟";
            return `submitted happiness level ${emoji}`;

        case "user_joined":
            return `joined the project`;

        case "user_left":
            return `left the project`;

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
