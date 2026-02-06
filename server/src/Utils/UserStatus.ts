export enum UserStatusEnum {
    CONFIRMED = "confirmed",
    UNCONFIRMED = "unconfirmed",
    SUSPENDED = "suspended",
    REMOVED = "removed",
}

export class UserStatus {
    private readonly status: UserStatusEnum;

    // Define valid transitions between states
    private static validTransitions: Record<UserStatusEnum, UserStatusEnum[]> = {
        [UserStatusEnum.CONFIRMED]: [UserStatusEnum.SUSPENDED],
        [UserStatusEnum.UNCONFIRMED]: [UserStatusEnum.CONFIRMED, UserStatusEnum.SUSPENDED, UserStatusEnum.REMOVED],
        [UserStatusEnum.SUSPENDED]: [UserStatusEnum.CONFIRMED, UserStatusEnum.REMOVED],
        [UserStatusEnum.REMOVED]: [],
    };

    constructor(initialStatus: UserStatusEnum = UserStatusEnum.UNCONFIRMED) {
        const validValues = Object.values(UserStatusEnum);
        if (!validValues.includes(initialStatus as UserStatusEnum)) {
            throw new Error(`Invalid initial status: ${initialStatus}`);
        }
        this.status = initialStatus;
    }

    getStatus(): UserStatusEnum {
        return this.status;
    }

    canTransitionTo(newStatus: UserStatusEnum): boolean {
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