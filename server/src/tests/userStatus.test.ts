import { describe, it, expect } from "vitest";
import { UserStatus, UserStatusEnum } from "../ValueTypes/UserStatus";

describe("UserStatus", () => {
    it("should initialize with the default status 'unconfirmed'", () => {
        const userStatus = UserStatus.unconfirmed();
        expect(userStatus.getStatus()).toBe(UserStatusEnum.unconfirmed);
    });

    it("should allow creating a new status with a specific initial value", () => {
        const userStatus = UserStatus.confirmed();
        expect(userStatus.getStatus()).toBe(UserStatusEnum.confirmed);
    });

    it("should allow transitioning from 'unconfirmed' to 'confirmed'", () => {
        const userStatus = UserStatus.unconfirmed();
        const newStatus = userStatus.confirm();
        expect(newStatus.getStatus()).toBe(UserStatusEnum.confirmed);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.unconfirmed); // Original remains unchanged
    });

    it("should allow transitioning from 'unconfirmed' to 'suspended'", () => {
        const userStatus = UserStatus.unconfirmed();
        const newStatus = userStatus.suspend();
        expect(newStatus.getStatus()).toBe(UserStatusEnum.suspended);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.unconfirmed); // Original remains unchanged
    });

    it("should allow transitioning from 'unconfirmed' to 'removed'", () => {
        const userStatus = UserStatus.unconfirmed();
        const newStatus = userStatus.remove();
        expect(newStatus.getStatus()).toBe(UserStatusEnum.removed);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.unconfirmed); // Original remains unchanged
    });

    it("should allow transitioning from 'suspended' to 'confirmed'", () => {
        const userStatus = UserStatus.suspended();
        const newStatus = userStatus.confirm();
        expect(newStatus.getStatus()).toBe(UserStatusEnum.confirmed);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.suspended); // Original remains unchanged
    });

    it("should allow transitioning from 'suspended' to 'removed'", () => {
        const userStatus = UserStatus.suspended();
        const newStatus = userStatus.remove();
        expect(newStatus.getStatus()).toBe(UserStatusEnum.removed);
        expect(userStatus.getStatus()).toBe(UserStatusEnum.suspended); // Original remains unchanged
    });

    it("should not allow transitioning from 'removed' to any other status", () => {
        const userStatus = UserStatus.removed();
        expect(() => userStatus.confirm()).toThrowError(
            "Invalid transition from removed to confirmed"
        );
        expect(() => userStatus.suspend()).toThrowError(
            "Invalid transition from removed to suspended"
        );
        expect(() => userStatus.remove()).toThrowError(
            "Invalid transition from removed to removed"
        );
    });

    it("should throw an error when initialized with an invalid status", () => {
        expect(() => UserStatus.fromString("invalid")).toThrowError(
            "Invalid user status: invalid"
        );
    });

    it("should return the correct status when using getStatus()", () => {
        const userStatus = UserStatus.suspended();
        expect(userStatus.getStatus()).toBe(UserStatusEnum.suspended);
    });

    it("should return the status string confirmed when using getStatusString()", () => {
        const userStatus = new UserStatus(UserStatusEnum.confirmed);
        expect(userStatus.getStatusString()).toBe("confirmed");
    });

    it("should return the status string unconfirmed when using getStatusString()", () => {
        const userStatus = new UserStatus(UserStatusEnum.unconfirmed);
        expect(userStatus.getStatusString()).toBe("unconfirmed");
    });

    it("should return the status string suspended when using getStatusString()", () => {
        const userStatus = new UserStatus(UserStatusEnum.suspended);
        expect(userStatus.getStatusString()).toBe("suspended");
    });

    it("should return the status string removed when using getStatusString()", () => {
        const userStatus = new UserStatus(UserStatusEnum.removed);
        expect(userStatus.getStatusString()).toBe("removed");
    });
      
});