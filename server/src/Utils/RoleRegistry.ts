import { Database } from "sqlite";
import { RoleKey } from "../ValueTypes/UserRole";
import { IllegalArgumentException } from "../Exceptions/IllegalArgumentException";


export class RoleRegistry {
    private idToRole = new Map<number, RoleKey>();
    private initialized = false;

    async load(db: Database) {
        try {
            const rows = await db.all<{ id: number, userRole: string }[]>(`SELECT id, userRole FROM roles`);
            rows.forEach(({ id, userRole }) => {
                this.idToRole.set(id, userRole as RoleKey);
            });
            this.initialized = true;
        } catch (error: unknown) {
            console.error("Error while fetching user roles", error);
            throw error;
        }
    }

    getId(role: string): number {
        if (!this.initialized) {
            throw new Error("RoleRegistry not initialized");
        }
        let id: number = -1;
        this.idToRole.forEach((value: RoleKey, key: number) => {
            if (role as RoleKey === value) {
                id = key;
                return;
            }
        });
        if (id === -1) {
            throw new IllegalArgumentException(`Unknown Role: ${role}`);
        }
        return id;
    }

    getRoleKey(id: number): RoleKey {
        if (!this.initialized) {
            throw new Error("RoleRegistry not initialized");
        }
        if (id === null || id === undefined) {
            throw new IllegalArgumentException(`Invalid role id: ${id}`);
        }
        const role = this.idToRole.get(id);
        if(!role) {
            throw new IllegalArgumentException(`Unknown id: ${id}`);
        }
        return role as RoleKey;
    }
}

export const roleRegistry = new RoleRegistry();