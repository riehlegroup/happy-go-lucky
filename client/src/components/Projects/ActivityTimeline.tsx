import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import activitiesApi, { ProjectActivity } from "@/services/api/activities";
import { getActivityIcon, getActivityText, formatTimestamp } from "@/utils/activityHelpers";

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
                <Clock className="mb-2 size-12 opacity-50" />
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
                    className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
                >
                    {/* Activity icon */}
                    <div className="mt-0.5">{getActivityIcon(activity.activityType)}</div>

                    {/* Activity details */}
                    <div className="min-w-0 flex-1">
                        <p className="text-sm">
                            <span className="font-medium text-gray-900">
                                {activity.userName}
                            </span>{" "}
                            <span className="text-gray-600">{getActivityText(activity)}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                            {formatTimestamp(activity.timestamp)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActivityTimeline;
