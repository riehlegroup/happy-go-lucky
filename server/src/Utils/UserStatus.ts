export enum UserStatusEnum {
    confirmed = "confirmed",
    unconfirmed = "unconfirmed",
    suspended = "suspended",
    removed = "removed",
}

export class UserStatus {
    private readonly status: UserStatusEnum;

    // Transition table; "removed" is terminal and confirmed -> removed matches current rules.
    private static validTransitions: Record<UserStatusEnum, UserStatusEnum[]> = {
        [UserStatusEnum.confirmed]: [UserStatusEnum.suspended, UserStatusEnum.removed],
        [UserStatusEnum.unconfirmed]: [UserStatusEnum.confirmed, UserStatusEnum.suspended, UserStatusEnum.removed],
        [UserStatusEnum.suspended]: [UserStatusEnum.confirmed, UserStatusEnum.removed],
        [UserStatusEnum.removed]: [],
    };

    constructor(initialStatus: UserStatusEnum = UserStatusEnum.unconfirmed) {
        if (!(initialStatus in UserStatusEnum)) {
            throw new Error(`Invalid initial status: ${initialStatus}`);
        }
        this.status = initialStatus;
    }

    // Validate raw inputs (e.g., API/DB) before casting to the enum.
    static isValidStatus(status: string): status is UserStatusEnum {
        return Object.values(UserStatusEnum).includes(status as UserStatusEnum);
    }

    // Convert persisted status strings into the value type.
    static fromString(status: string): UserStatus {
        if (!UserStatus.isValidStatus(status)) {
            throw new Error(`Invalid initial status: ${status}`);
        }
        return new UserStatus(status);
    }

    getStatus(): UserStatusEnum {
        return this.status;
    }

    canTransitionTo(newStatus: UserStatusEnum): boolean {
        if (newStatus === this.status) {
            // Same-status updates are treated as idempotent.
            return true;
        }
        const allowedTransitions = UserStatus.validTransitions[this.status];
        return allowedTransitions.includes(newStatus);
    }

    transitionTo(newStatus: UserStatusEnum): UserStatus {
        if (this.canTransitionTo(newStatus)) {
            return new UserStatus(newStatus); // Return a new instance since UserStatus is a value object
        } else {
            throw new Error(
                `Invalid transition from ${this.status} to ${newStatus}`
            );
        }
    }
}
