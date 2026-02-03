export enum UserStatusEnum {
  confirmed = "confirmed",
  unconfirmed = "unconfirmed",
  suspended = "suspended",
  removed = "removed",
}

export class UserStatus {
  private static readonly validTransitions: Record<UserStatusEnum, UserStatusEnum[]> = {
    [UserStatusEnum.confirmed]: [UserStatusEnum.suspended],
    [UserStatusEnum.unconfirmed]: [
      UserStatusEnum.confirmed,
      UserStatusEnum.suspended,
      UserStatusEnum.removed,
    ],
    [UserStatusEnum.suspended]: [UserStatusEnum.confirmed, UserStatusEnum.removed],
    [UserStatusEnum.removed]: [],
  };

  private constructor(private readonly status: UserStatusEnum) {}

  public static unconfirmed(): UserStatus {
    return new UserStatus(UserStatusEnum.unconfirmed);
  }

  public static confirmed(): UserStatus {
    return new UserStatus(UserStatusEnum.confirmed);
  }

  public static suspended(): UserStatus {
    return new UserStatus(UserStatusEnum.suspended);
  }

  public static removed(): UserStatus {
    return new UserStatus(UserStatusEnum.removed);
  }

  public static fromString(value: string | null | undefined): UserStatus {
    if (value === null || value === undefined) {
      return UserStatus.unconfirmed();
    }

    switch (value) {
      case UserStatusEnum.unconfirmed:
        return UserStatus.unconfirmed();
      case UserStatusEnum.confirmed:
        return UserStatus.confirmed();
      case UserStatusEnum.suspended:
        return UserStatus.suspended();
      case UserStatusEnum.removed:
        return UserStatus.removed();
      default:
        throw new Error(`Invalid user status: ${value}`);
    }
  }

  public getStatus(): UserStatusEnum {
    return this.status;
  }

  public is(status: UserStatusEnum): boolean {
    return this.status === status;
  }

  public toString(): string {
    return this.status;
  }

  public confirm(): UserStatus {
    return this.transitionTo(UserStatusEnum.confirmed);
  }

  public suspend(): UserStatus {
    return this.transitionTo(UserStatusEnum.suspended);
  }

  public remove(): UserStatus {
    return this.transitionTo(UserStatusEnum.removed);
  }

  public canConfirm(): boolean {
    return this.canTransitionTo(UserStatusEnum.confirmed);
  }

  public canSuspend(): boolean {
    return this.canTransitionTo(UserStatusEnum.suspended);
  }

  public canRemove(): boolean {
    return this.canTransitionTo(UserStatusEnum.removed);
  }

  private canTransitionTo(newStatus: UserStatusEnum): boolean {
    return UserStatus.validTransitions[this.status].includes(newStatus);
  }

  private transitionTo(newStatus: UserStatusEnum): UserStatus {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Invalid transition from ${this.status} to ${newStatus}`);
    }

    return new UserStatus(newStatus);
  }
}
