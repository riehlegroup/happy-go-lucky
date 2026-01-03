export enum UserStatusEnum {
    confirmed = "confirmed",
    unconfirmed = "unconfirmed",
    suspended = "suspended",
    removed = "removed",
}

export class UserStatus {
    private readonly status: UserStatusEnum;

    // Define valid transitions between states
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

    static isValidStatus(status: string): status is UserStatusEnum {
        return Object.values(UserStatusEnum).includes(status as UserStatusEnum);
    }

    static fromString(status: string | null): UserStatus {
        if (status === null) {
            return new UserStatus(UserStatusEnum.unconfirmed);
        }
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
