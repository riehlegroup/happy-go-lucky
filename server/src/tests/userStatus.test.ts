import { describe, it, expect } from "vitest";
import { UserStatus, UserStatusEnum } from "../Utils/UserStatus";

describe("UserStatus", () => {
    it("should initialize with the default status 'unconfirmed'", () => {
        const userStatus = new UserStatus();
        expect(userStatus.getStatus()).toBe(UserStatusEnum.UNCONFIRMED);
    });

    it("should allow creating a new status with a specific initial value", () => {
        const userStatus = new UserStatus(UserStatusEnum.CONFIRMED);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.CONFIRMED);
    });

    it("should allow transitioning from 'unconfirmed' to 'confirmed'", () => {
        const userStatus = new UserStatus();
        const newStatus = userStatus.transitionTo(UserStatusEnum.CONFIRMED);
        expect(newStatus.getStatus()).toBe(UserStatusEnum.CONFIRMED);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.UNCONFIRMED); // Original remains unchanged
    });

    it("should allow transitioning from 'unconfirmed' to 'suspended'", () => {
        const userStatus = new UserStatus();
        const newStatus = userStatus.transitionTo(UserStatusEnum.SUSPENDED);
        expect(newStatus.getStatus()).toBe(UserStatusEnum.SUSPENDED);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.UNCONFIRMED); // Original remains unchanged
    });

    it("should allow transitioning from 'unconfirmed' to 'removed'", () => {
        const userStatus = new UserStatus();
        const newStatus = userStatus.transitionTo(UserStatusEnum.REMOVED);
        expect(newStatus.getStatus()).toBe(UserStatusEnum.REMOVED);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.UNCONFIRMED); // Original remains unchanged
    });

    it("should allow transitioning from 'suspended' to 'confirmed'", () => {
        const userStatus = new UserStatus(UserStatusEnum.SUSPENDED);
        const newStatus = userStatus.transitionTo(UserStatusEnum.CONFIRMED);
        expect(newStatus.getStatus()).toBe(UserStatusEnum.CONFIRMED);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.SUSPENDED); // Original remains unchanged
    });

    it("should allow transitioning from 'suspended' to 'removed'", () => {
        const userStatus = new UserStatus(UserStatusEnum.SUSPENDED);
        const newStatus = userStatus.transitionTo(UserStatusEnum.REMOVED);
        expect(newStatus.getStatus()).toBe(UserStatusEnum.REMOVED);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.SUSPENDED); // Original remains unchanged
    });

    it("should not allow transitioning from 'removed' to any other status", () => {
        const userStatus = new UserStatus(UserStatusEnum.REMOVED);
        expect(() => userStatus.transitionTo(UserStatusEnum.CONFIRMED)).toThrowError(
            "Invalid transition from removed to confirmed"
        );
        expect(() => userStatus.transitionTo(UserStatusEnum.UNCONFIRMED)).toThrowError(
            "Invalid transition from removed to unconfirmed"
        );
        expect(() => userStatus.transitionTo(UserStatusEnum.SUSPENDED)).toThrowError(
            "Invalid transition from removed to suspended"
        );
    });

    it("should throw an error when initialized with an invalid status", () => {
        expect(() => new UserStatus("invalid" as UserStatusEnum)).toThrowError(
            "Invalid initial status: invalid"
        );
    });

    it("should return the correct status when using getStatus()", () => {
        const userStatus = new UserStatus(UserStatusEnum.SUSPENDED);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.SUSPENDED);
    });
});
