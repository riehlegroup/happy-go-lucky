import { IllegalArgumentException } from "../Exceptions/IllegalArgumentException";

export enum UserRoleEnum {
  USER = "USER",
  ADMIN = "ADMIN",
}

export class UserRole {
  private readonly value: UserRoleEnum;

  private constructor(value: UserRoleEnum) {
    this.value = value;
  }

  static user(): UserRole {
    return new UserRole(UserRoleEnum.USER);
  }

  static admin(): UserRole {
    return new UserRole(UserRoleEnum.ADMIN);
  }

  static fromString(role: string | null | undefined): UserRole {
    if (role === UserRoleEnum.ADMIN) {
      return UserRole.admin();
    }
    if (role === UserRoleEnum.USER) {
      return UserRole.user();
    }

    IllegalArgumentException.assert(false, `Invalid user role: '${role}'`);
    return UserRole.user();
  }

  toString(): string {
    return this.value;
  }

  equals(other: UserRole): boolean {
    return this.value === other.value;
  }

  isAdmin(): boolean {
    return this.value === UserRoleEnum.ADMIN;
  }

  isUser(): boolean {
    return this.value === UserRoleEnum.USER;
  }

  promoteToAdmin(): UserRole {
    return UserRole.admin();
  }

  demoteToUser(): UserRole {
    return UserRole.user();
  }
}
