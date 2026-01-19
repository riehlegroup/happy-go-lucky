import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { roleRegistry } from "../Utils/RoleRegistry";
import { createTestDb } from "./api/helpers/testDb";
import { RoleKey, UserRole } from "../ValueTypes/UserRole";
import { IllegalArgumentException } from "../Exceptions/IllegalArgumentException";

describe("RoleRegistry", () => {

    describe("database", () => {
        let db: Database;

        beforeEach(async () => {
            db = await open({
                filename: ':memory:',
                driver: sqlite3.Database,
            });
        })

        it("load with empty db", async () => {
            await expect(roleRegistry.load(db)).rejects.toThrow();
        });

        it("load with wrong table schema", async () => {
            await db.exec(`CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY UNIQUE,
                role TEXT NOT NULL)`);

            await expect(roleRegistry.load(db)).rejects.toThrow();
        });
    });

    describe("inputs", () => {
        let db: Database;

        beforeAll(async () => {
            db = await createTestDb();
            await roleRegistry.load(db);
        });
        
        it("non-existent role", () => {
            expect(() => {roleRegistry.getId("admin")}).toThrow(IllegalArgumentException);
            expect(() => {roleRegistry.getId(" ADMIN")}).toThrow(IllegalArgumentException);
            expect(() => {roleRegistry.getId("Test")}).toThrow(IllegalArgumentException);
        });

        it("non-existent id", () => {
            expect(() => {roleRegistry.getRoleKey(-1)}).toThrow(IllegalArgumentException);
            expect(() => {roleRegistry.getRoleKey(0)}).toThrow(IllegalArgumentException);
            expect(() => {roleRegistry.getRoleKey(3)}).toThrow(IllegalArgumentException);
        });

        it("valid roles", async () => {
            const userId = await db.get("SELECT id FROM roles WHERE userRole=?", RoleKey.USER as string);
            const adminId = await db.get("SELECT id FROM roles WHERE userRole=?", RoleKey.ADMIN as string);

            expect(roleRegistry.getId(RoleKey.USER as string)).toBe(userId.id);
            expect(roleRegistry.getId(RoleKey.ADMIN as string)).toBe(adminId.id);
        });
        
        it("valid ids", async () => {
            const userId = await db.get("SELECT id FROM roles WHERE userRole=?", RoleKey.USER as string);
            const adminId = await db.get("SELECT id FROM roles WHERE userRole=?", RoleKey.ADMIN as string);
           
            expect(roleRegistry.getRoleKey(userId.id as number)).toBe(RoleKey.USER);
            expect(roleRegistry.getRoleKey(adminId.id as number)).toBe(RoleKey.ADMIN);
        });
    });
});

describe("UserRole", () => {
    let db: Database;
    let userId: number;
    let adminId: number;

    beforeAll(async () => {
        db = await createTestDb();
        await roleRegistry.load(db);

        userId = (await db.get("SELECT id FROM roles WHERE userRole=?", RoleKey.USER as string)).id;
        adminId = (await db.get("SELECT id FROM roles WHERE userRole=?", RoleKey.ADMIN as string)).id;
    });

    it("creates a USER role from id", () => {
        const role = UserRole.fromId(userId, roleRegistry);

        expect(role.getId()).toBe(userId);
        expect(role.getRole()).toBe(RoleKey.USER);
        expect(role.isAdmin()).toBe(false);
    });

    it("creates an ADMIN role from id", () => {
        const role = UserRole.fromId(adminId, roleRegistry);

        expect(role.getId()).toBe(adminId);
        expect(role.getRole()).toBe(RoleKey.ADMIN);
        expect(role.isAdmin()).toBe(true);
    });

    it("creates a role from role string", () => {
        const role = UserRole.fromRole("USER", roleRegistry);

        expect(role.getRole()).toBe(RoleKey.USER);
        expect(role.isAdmin()).toBe(false);
    });

    it("equals returns true for same role id", () => {
        const role1 = UserRole.fromId(userId, roleRegistry);
        const role2 = UserRole.fromRole("USER", roleRegistry);

        expect(role1.equals(role2)).toBe(true);
    });

    it("equals returns false for different role ids", () => {
        const userRole = UserRole.fromId(userId, roleRegistry);
        const adminRole = UserRole.fromId(adminId, roleRegistry);

        expect(userRole.equals(adminRole)).toBe(false);
    });

    it("throws when creating role from unknown role string", () => {
        expect(() =>
        UserRole.fromRole("SUPER_ADMIN", roleRegistry)
        ).toThrow();
    });
});
