import { describe, it, expect } from "vitest";
import { UserStatus, UserStatusEnum } from "../Utils/UserStatus";

describe("UserStatus", () => {
    it("should initialize with the default status 'unconfirmed'", () => {
        const userStatus = new UserStatus();
        expect(userStatus.getStatus()).toBe(UserStatusEnum.unconfirmed);
    });

    it("should allow creating a new status with a specific initial value", () => {
        const userStatus = new UserStatus(UserStatusEnum.confirmed);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.confirmed);
    });

    it("should allow transitioning from 'unconfirmed' to 'confirmed'", () => {
        const userStatus = new UserStatus();
        const newStatus = userStatus.transitionTo(UserStatusEnum.confirmed);
        expect(newStatus.getStatus()).toBe(UserStatusEnum.confirmed);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.unconfirmed); // Original remains unchanged
    });

    it("should allow transitioning from 'unconfirmed' to 'suspended'", () => {
        const userStatus = new UserStatus();
        const newStatus = userStatus.transitionTo(UserStatusEnum.suspended);
        expect(newStatus.getStatus()).toBe(UserStatusEnum.suspended);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.unconfirmed); // Original remains unchanged
    });

    it("should allow transitioning from 'unconfirmed' to 'removed'", () => {
        const userStatus = new UserStatus();
        const newStatus = userStatus.transitionTo(UserStatusEnum.removed);
        expect(newStatus.getStatus()).toBe(UserStatusEnum.removed);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.unconfirmed); // Original remains unchanged
    });

    it("should allow transitioning from 'confirmed' to 'removed'", () => {
        const userStatus = new UserStatus(UserStatusEnum.confirmed);
        const newStatus = userStatus.transitionTo(UserStatusEnum.removed);
        expect(newStatus.getStatus()).toBe(UserStatusEnum.removed);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.confirmed); // Original remains unchanged
    });

    it("should allow transitioning from 'suspended' to 'confirmed'", () => {
        const userStatus = new UserStatus(UserStatusEnum.suspended);
        const newStatus = userStatus.transitionTo(UserStatusEnum.confirmed);
        expect(newStatus.getStatus()).toBe(UserStatusEnum.confirmed);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.suspended); // Original remains unchanged
    });

    it("should allow transitioning from 'suspended' to 'removed'", () => {
        const userStatus = new UserStatus(UserStatusEnum.suspended);
        const newStatus = userStatus.transitionTo(UserStatusEnum.removed);
        expect(newStatus.getStatus()).toBe(UserStatusEnum.removed);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.suspended); // Original remains unchanged
    });

    it("should not allow transitioning from 'removed' to any other status", () => {
        const userStatus = new UserStatus(UserStatusEnum.removed);
        expect(() => userStatus.transitionTo(UserStatusEnum.confirmed)).toThrowError(
            "Invalid transition from removed to confirmed"
        );
        expect(() => userStatus.transitionTo(UserStatusEnum.unconfirmed)).toThrowError(
            "Invalid transition from removed to unconfirmed"
        );
        expect(() => userStatus.transitionTo(UserStatusEnum.suspended)).toThrowError(
            "Invalid transition from removed to suspended"
        );
    });

    it("should throw an error when initialized with an invalid status", () => {
        expect(() => new UserStatus("invalid" as UserStatusEnum)).toThrowError(
            "Invalid initial status: invalid"
        );
    });

    it("should return the correct status when using getStatus()", () => {
        const userStatus = new UserStatus(UserStatusEnum.suspended);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.suspended);
    });
});
