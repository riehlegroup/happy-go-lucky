import { describe, it, expect } from "vitest";
import { UserRole, UserRoleEnum } from "../Utils/UserRole";

describe("UserRole", () => {
    it("should initialize with the default role 'user'", () => {
        const userRole = new UserRole();
        expect(userRole.getRole()).toBe(UserRoleEnum.user);
    });

    it("should allow creating a new role with a specific initial value", () => {
        const userRole = new UserRole(UserRoleEnum.admin);
        expect(userRole.getRole()).toBe(UserRoleEnum.admin);
    });

    it("should allow transitioning role from 'user' to 'admin'", () => {
        const userRole = new UserRole(UserRoleEnum.user);
        const newRole = userRole.transitionTo(UserRoleEnum.admin);
        expect(newRole.getRole()).toBe(UserRoleEnum.admin);
        expect(userRole.getRole()).toBe(UserRoleEnum.user); // Original remains unchanged
    });

    it("should allow transitioning role from 'admin' to 'user'", () => {
        const userRole = new UserRole(UserRoleEnum.admin);
        const newRole = userRole.transitionTo(UserRoleEnum.user);
        expect(newRole.getRole()).toBe(UserRoleEnum.user);
        expect(userRole.getRole()).toBe(UserRoleEnum.admin); // Original remains unchanged
    });

    it("should throw an error when initialized with an invalid role", () => {
        expect(() => new UserRole("invalid" as UserRoleEnum)).toThrowError(
            "Invalid initial role: invalid"
        );
    });

    it("should return the correct role (admin) when using getRole()", () => {
        const userRole = new UserRole(UserRoleEnum.admin);
        expect(userRole.getRole()).toBe(UserRoleEnum.admin);
    });

    it("should return the correct role (user) when using getRole()", () => {
        const userRole = new UserRole(UserRoleEnum.user);
        expect(userRole.getRole()).toBe(UserRoleEnum.user);
    });
});
