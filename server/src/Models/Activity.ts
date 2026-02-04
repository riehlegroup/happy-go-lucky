/**
 * Base Activity Class
 * 
 * Abstract base class for all activity types with common validation and data handling.
 * Subclasses define specific activity types with their own validation rules.
 */
export abstract class Activity {
    readonly activityType: string;
    readonly timestamp: string;

    constructor(activityType: string) {
        this.activityType = activityType;
        this.timestamp = new Date().toISOString();
    }

    /**
     * Validate activity-specific data
     * Subclasses override this to implement type-specific validation
     */
    abstract validate(): void;

    /**
     * Get activity data as JSON string
     * Subclasses override this to provide type-specific data
     */
    abstract getActivityData(): string | null;

    /**
     * Get human-readable description of the activity
     */
    abstract getDescription(): string;
}

/**
 * StandupSubmittedActivity
 * Represents a standup submission activity
 */
export class StandupSubmittedActivity extends Activity {
    constructor() {
        super('standup_submitted');
    }

    validate(): void {
        // Standup submissions don't require additional data
    }

    getActivityData(): string | null {
        return null;
    }

    getDescription(): string {
        return 'submitted a standup update';
    }
}

/**
 * HappinessSubmittedActivity
 * Represents a happiness rating submission activity
 */
export class HappinessSubmittedActivity extends Activity {
    private happiness: number;

    constructor(happiness: number) {
        super('happiness_submitted');
        this.happiness = happiness;
        this.validate();
    }

    validate(): void {
        if (typeof this.happiness !== 'number' || this.happiness < 1 || this.happiness > 5) {
            throw new Error('Happiness level must be a number between 1 and 5');
        }
    }

    getActivityData(): string {
        return JSON.stringify({ happiness: this.happiness });
    }

    getDescription(): string {
        const emoji = this.happiness >= 4 ? "😊" : this.happiness >= 3 ? "😐" : "😟";
        return `submitted happiness level ${emoji}`;
    }

    getHappiness(): number {
        return this.happiness;
    }
}

/**
 * UserJoinedActivity
 * Represents a user joining a project
 */
export class UserJoinedActivity extends Activity {
    private role: string;

    constructor(role: string = 'DEVELOPER') {
        super('user_joined');
        this.role = role;
        this.validate();
    }

    validate(): void {
        const validRoles = ['OWNER', 'DEVELOPER', 'VIEWER'];
        if (!validRoles.includes(this.role)) {
            throw new Error(`Invalid role: ${this.role}. Must be one of: ${validRoles.join(', ')}`);
        }
    }

    getActivityData(): string {
        return JSON.stringify({ role: this.role });
    }

    getDescription(): string {
        return `joined the project as ${this.role}`;
    }

    getRole(): string {
        return this.role;
    }
}

/**
 * UserLeftActivity
 * Represents a user leaving a project
 */
export class UserLeftActivity extends Activity {
    constructor() {
        super('user_left');
    }

    validate(): void {
        // User left activity doesn't require additional data
    }

    getActivityData(): string | null {
        return null;
    }

    getDescription(): string {
        return 'left the project';
    }
}

/**
 * ProjectCreatedActivity
 * Represents a new project being created
 */
export class ProjectCreatedActivity extends Activity {
    private projectDetails: { name: string; courseName: string };

    constructor(projectName: string, courseName: string) {
        super('project_created');
        this.projectDetails = { name: projectName, courseName };
        this.validate();
    }

    validate(): void {
        if (!this.projectDetails.name || !this.projectDetails.courseName) {
            throw new Error('Project name and course name are required');
        }
    }

    getActivityData(): string {
        return JSON.stringify(this.projectDetails);
    }

    getDescription(): string {
        return `created project "${this.projectDetails.name}" in course "${this.projectDetails.courseName}"`;
    }

    getProjectDetails() {
        return this.projectDetails;
    }
}

/**
 * ProjectUpdatedActivity
 * Represents project settings being updated
 */
export class ProjectUpdatedActivity extends Activity {
    private changes: Record<string, unknown>;

    constructor(changes: Record<string, unknown> = {}) {
        super('project_updated');
        this.changes = changes;
        this.validate();
    }

    validate(): void {
        if (Object.keys(this.changes).length === 0) {
            throw new Error('At least one change must be specified');
        }
    }

    getActivityData(): string {
        return JSON.stringify(this.changes);
    }

    getDescription(): string {
        const changeKeys = Object.keys(this.changes);
        return `updated project settings: ${changeKeys.join(', ')}`;
    }

    getChanges(): Record<string, unknown> {
        return this.changes;
    }
}

/**
 * Activity Factory
 * Creates activity instances from raw data
 * Ensures type safety and validation
 */
export class ActivityFactory {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static create(activityType: string, activityData?: any): Activity {
        switch (activityType) {
            case 'standup_submitted':
                return new StandupSubmittedActivity();

            case 'happiness_submitted':
                if (!activityData?.happiness) {
                    throw new Error('Happiness activity requires happiness level');
                }
                return new HappinessSubmittedActivity(activityData.happiness);

            case 'user_joined':
                return new UserJoinedActivity(activityData?.role);

            case 'user_left':
                return new UserLeftActivity();

            case 'project_created':
                if (!activityData?.name || !activityData?.courseName) {
                    throw new Error('Project created activity requires project name and course name');
                }
                return new ProjectCreatedActivity(activityData.name, activityData.courseName);

            case 'project_updated':
                return new ProjectUpdatedActivity(activityData || {});

            default:
                throw new Error(`Unknown activity type: ${activityType}`);
        }
    }
}
