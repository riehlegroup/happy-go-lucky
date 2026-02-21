import { describe, expect, it } from "vitest";
import { UserRole, UserRoleEnum } from "../ValueTypes/UserRole";

describe("UserRole", () => {
  it("parses and serializes roles", () => {
    expect(UserRole.fromString("ADMIN").isAdmin()).toBe(true);
    expect(UserRole.fromString("USER").isUser()).toBe(true);
    expect(UserRole.admin().toString()).toBe("ADMIN");
    expect(UserRole.user().toString()).toBe("USER");
  });

  it("supports explicit transitions", () => {
    const role = UserRole.user();
    const promoted = role.promoteToAdmin();
    expect(promoted.isAdmin()).toBe(true);

    const demoted = promoted.demoteToUser();
    expect(demoted.isUser()).toBe(true);
  });

  it("exposes enum values", () => {
    expect(UserRole.fromString(UserRoleEnum.ADMIN).isAdmin()).toBe(true);
  });

  it("throws on invalid role input", () => {
    expect(() => UserRole.fromString("INVALID")).toThrow(/Invalid user role/);
    expect(() => UserRole.fromString(null)).toThrow(/Invalid user role/);
  });
});
