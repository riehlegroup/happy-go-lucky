import { Database } from "sqlite";
import { RoleKey } from "../ValueTypes/UserRole";
import { IllegalArgumentException } from "../Exceptions/IllegalArgumentException";


export class RoleRegistry {
    private roleToId = new Map<number, string>();
    private initialized = false;

    async load(db: Database) {
        try {
            const rows = await db.all<{ id: number, userRole: string }[]>(`SELECT id, userRole FROM roles`);
            rows.forEach(({ id, userRole }) => {
                this.roleToId.set(id, userRole);
            });
            this.initialized = true;
        } catch (error: unknown) {
            console.error("Error while fetching user roles", error);
        }
    }

    getId(role: string): number {
        if (!this.initialized) {
            throw new Error("RoleRegistry not initialized");
        }
        let id: number = -1;
        this.roleToId.forEach((value: string, key: number) => {
            if (role == value) id = key;
        });
        if (id == -1) {
            throw new IllegalArgumentException(`Unknown Role: ${role}`);
        }
        return id;
    }

    getRoleKey(id: number): RoleKey {
        if (!this.initialized) {
            throw new Error("RoleRegistry not initialized");
        }
        if (!id) {
            throw new IllegalArgumentException(`Invalid role id: ${id}`);
        }
        const role = this.roleToId.get(id);
        if(!role) {
            throw new IllegalArgumentException(`Unknown id: ${id}`);
        }
        return role as RoleKey;
    }
}

export const roleRegistry = new RoleRegistry();