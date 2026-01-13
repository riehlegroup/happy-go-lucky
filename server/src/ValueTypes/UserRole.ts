import { IllegalArgumentException } from "../Exceptions/IllegalArgumentException";
import { roleRegistry } from "../Utils/RoleRegistry";

// if roles are added the database default values need to be added in the db [server/src/databaseInitializer.ts]
export type RoleKey = "USER" | "ADMIN";

export class UserRole {
  private readonly value: RoleKey;

  constructor(role: RoleKey) {      // TODO: constructor with RoleKey or ID
    IllegalArgumentException.assert(this.isValidRole(role), 'Invalid user role');
    this.value = role;
  }

  getRoleId(): number {
    return roleRegistry.getId(this.value);
  }

  isValidRole(role: RoleKey): boolean {
    try {
        const id = roleRegistry.getId(role);
    } catch (error: any) {
        if (error instanceof IllegalArgumentException) {
            console.error("Invalid role used in UserRole", error);
        } else {
            throw error;
        }
    }
    return true;
  }

  isAdmin(): boolean {
    if (this.value === "ADMIN") return true;
    return false;
  }
}

