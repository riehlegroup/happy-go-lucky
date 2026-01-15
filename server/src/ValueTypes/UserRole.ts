import { RoleRegistry } from "../Utils/RoleRegistry";

// if roles are added the database default values need to be added in the db [server/src/databaseInitializer.ts]
export enum RoleKey {
  USER = "USER",
  ADMIN = "ADMIN"
}

export class UserRole {

  private constructor(
    private readonly id: number, 
    private readonly role: RoleKey
  ){}

  static fromId(id: number, registry: RoleRegistry): UserRole {
    return new UserRole(id, registry.getRoleKey(id));
  }

  static fromRole(role: string, registry: RoleRegistry): UserRole {
    return new UserRole(registry.getId(role), role as RoleKey);
  }

  getId(): number {
    return this.id;
  }

  getRole(): string {
    return this.role;
  }

  isAdmin(): boolean {
    return this.role === "ADMIN";
  }

  equals(other: UserRole): boolean {
    return this.id === other.id;  
  }
}

