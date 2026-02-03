import { Serializable } from "./Serializable";
import { Reader } from "./Reader";
import { ObjectHandler } from "../ObjectHandler";
import { Database } from "sqlite";
import { ResultSet, ResultRow } from "./ResultSetTypes";

/**
 * Reader Class
 * 
 * Reads/Writes Serializable Entities to SQLite Database
 * 
 */
export class DatabaseResultSetReader implements Reader {
    protected attributes: {[attributeName: string]: string | number | null} = {};
    protected resultSet: Promise<ResultSet>;
    protected db: Database;

    protected wasHandled: Map<{className: string, id: number}, {instance: Serializable}> = new Map();

    
    constructor(resultSet: Promise<ResultSet>, db: Database) {
        this.resultSet = resultSet;
        this.db = db;
    }

    async readRoot<T extends Serializable> (
        Constructor: new (id: number) => T
    ): Promise<T | T[]> {
        this.wasHandled = new Map();
        // await resultSet
        const result = await this.resultSet;
        // either read all or read single row
        if (Array.isArray(result)) {
            return await this.readAll(result, Constructor); // This is now a Promise<T[]>
        } else { // Read single row:
            return await this.readRow<T>(result, Constructor);
        }
    }

    readAll<T extends Serializable> (
        result: ResultRow[], Constructor: new (id: number) => T
    ): Promise<T[]> {
        return Promise.all(result.map((row: ResultRow) => this.readRow<T>(row, Constructor)));
    }

    async readRow<T extends Serializable> (
        row: ResultRow, Constructor: new (id: number) => T
    ): Promise<T> {
        // Reset attributes dict
        this.attributes = {};
        // Read all attributes
        for (const attribute in row) {
            if (this.isValidKey(attribute, row)) {
                const value = row[attribute];
                // Some type checks
                if (value !== undefined && 
                    (typeof value === 'string' || typeof value === 'number' || value === null)) {
                    this.attributes[attribute] = value;
                }
            }
        }
        // Create new instance
        let s: T;
        // Checking if this table had an id entry.
        if ("id" in this.attributes && typeof this.attributes["id"] === "number") {
            s = new Constructor(this.attributes["id"]);
        } else {
            throw Error("Something went terribly wrong and the db entry does not have an id attribute!");
        }
        // Read all attributes into new instance
        await s.readFrom(this);
        return s;
    }

    async readObject(attributeName: string, className: string): Promise<Serializable | null> {
        // Assuming Object to be id-referenced:
        const id = this.attributes[attributeName];
        if (typeof id !== 'number') {
            throw new Error("Error during Serialization: ID " + attributeName + " is not a number!");
        }
        // Check if Object was read already:
        if (this.wasHandled.has({className: className, id: id})) {
            console.log("Found a "+ className+" with id "+ id +" in wasHandled.");
            const o = this.wasHandled.get({className: className, id: id})?.instance;
            if (o !== undefined) {
                return o;
            }
        }
        // if not handled yet, create a new Instance and add to wasHandled.
        const oh = new ObjectHandler();
        const obj = await oh.getSerializableFromId(id, className, this.db);
        console.log("Tried to get a "+ className +" with id "+ id +" from db. Result: "+ JSON.stringify(obj));
        if (obj === null) {
            return obj;
        }
        this.wasHandled.set({className: className, id: id}, {instance: obj});
        console.log("returning obj to instance.");
        return obj;
    }

    readObjects(_: string, className: string): Promise<Serializable[]> {
        const id = this.attributes['id'];

        if (typeof id !== 'number') {
            throw new Error("readObjects currently requires a numbered id!");
        }

        const oh = new ObjectHandler();

        return oh.getSerializablesFromId(id, className, this.db);
    }

    readString(attributeName: string): string | null{
        const val = this.attributes[attributeName];
        if (val !== null && typeof val !== 'string' ) {
            throw new Error("Error during Serialization: Attribute " + attributeName + " is not a string! (type of val is " + typeof val +").\nAttributes is: "+ JSON.stringify(this.attributes));  
        }
        return val;
    }
    readNumber(attributeName: string): number | null {
        const val = this.attributes[attributeName];
        if (val !== null && typeof val !== 'number') {
            throw new Error("Error during Serialization: Attribute " + attributeName + " is not a number!");
        }
        return val;
    }
    readDateTime(attributeName: string): Date | null {
        const val = this.readNumber(attributeName);
        if (val) return new Date(val * 1000);
        else return null;
    }
    

    protected isValidKey<T extends object>(key: string | number | symbol, obj: T): key is keyof T {
        return key in obj;
    }
}