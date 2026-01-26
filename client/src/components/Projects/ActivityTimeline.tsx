import React, { useEffect, useState } from "react";
import { Clock, Users, Smile, MessageSquare } from "lucide-react";
import activitiesApi, { ProjectActivity } from "@/services/api/activities";

interface ActivityTimelineProps {
    projectName: string;
}

/**
 * ActivityTimeline Component
 * 
 * Displays a chronological list of project activities (standups, happiness submissions, team joins/leaves)
 * 
 * @param projectName - The name of the project to show activities for
 */
const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ projectName }) => {
    // State management
    const [activities, setActivities] = useState<ProjectActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch activities when project changes
    useEffect(() => {
        const fetchActivities = async () => {
            if (!projectName) return;

            try {
                setLoading(true);
                const data = await activitiesApi.getProjectActivities(projectName, 20);
                setActivities(data);
                setError(null);
            } catch (err) {
                console.error("Error fetching activities:", err);
                setError("Failed to load activity timeline");
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [projectName]);

    /**
     * Get the appropriate icon for each activity type
     */
    const getActivityIcon = (activityType: string) => {
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
     */
    const getActivityText = (activity: ProjectActivity): string => {
        // Parse additional data if available
        const activityData = activity.activityData
            ? JSON.parse(activity.activityData)
            : null;

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
     */
    const formatTimestamp = (timestamp: string): string => {
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

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading activity timeline...</div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    // Empty state - no activities yet
    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mb-2 opacity-50" />
                <p>No activity yet. Be the first to contribute!</p>
            </div>
        );
    }

    // Render activity list
    return (
        <div className="space-y-3">
            {activities.map((activity) => (
                <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    {/* Activity icon */}
                    <div className="mt-0.5">{getActivityIcon(activity.activityType)}</div>

                    {/* Activity details */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm">
                            <span className="font-medium text-gray-900">
                                {activity.userName}
                            </span>{" "}
                            <span className="text-gray-600">{getActivityText(activity)}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {formatTimestamp(activity.timestamp)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActivityTimeline;
