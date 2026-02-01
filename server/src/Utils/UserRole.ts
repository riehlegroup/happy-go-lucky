export enum UserRoleEnum {
    user = "USER",
    admin = "ADMIN",
}

export class UserRole {
    private readonly role: UserRoleEnum;

    // Define valid transitions between states
    private static validTransitions: Record<UserRoleEnum, UserRoleEnum[]> = {
        [UserRoleEnum.user]: [UserRoleEnum.admin],
        [UserRoleEnum.admin]: [UserRoleEnum.user],
    };

    constructor(initialRole: UserRoleEnum = UserRoleEnum.user) {
        if (!Object.values(UserRoleEnum).includes(initialRole)) {
            throw new Error(`Invalid initial role: ${initialRole}`);
        }
        this.role = initialRole;
    }

    getRole(): UserRoleEnum {
        return this.role;
    }

    canTransitionTo(newRole: UserRoleEnum): boolean {
        const allowedTransitions = UserRole.validTransitions[this.role];
        return allowedTransitions.includes(newRole); 
    }

    transitionTo(newRole: UserRoleEnum): UserRole {
        if (this.role === newRole) {
            return this; // No transition needed
        }
        if (this.canTransitionTo(newRole)) {
            return new UserRole(newRole); // Return a new instance since UserRole is a value object
        } else {
            throw new Error(
                `Invalid transition from ${this.role} to ${newRole}`
            );
        }
    }
}