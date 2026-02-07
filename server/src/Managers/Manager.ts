import { Database } from "sqlite";
import { ObjectHandler } from "../ObjectHandler";

/**
 * Interface for all domain managers.
 *
 * Managers encapsulate business logic and data access for specific domains
 * (e.g., courses, projects, users). Each manager has domain-specific methods,
 * so this interface is intentionally minimal to ensure structural consistency
 * without forcing unrelated methods across different domains.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Manager {
  // Interface is intentionally minimal - managers have domain-specific methods
}

/**
 * Constructor signature for all managers.
 */
export interface ManagerConstructor {
  new (db: Database, oh: ObjectHandler): Manager;
}
