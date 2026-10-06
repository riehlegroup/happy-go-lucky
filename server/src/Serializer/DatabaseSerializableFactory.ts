import { Serializable } from "../Serializer/Serializable";
import { SerializableFactory } from "../Serializer/SerializableFactory";
import { Database } from "sqlite";
import { User } from "../Models/User";
import { DatabaseWriter } from "./DatabaseWriter";
import { CourseProject } from "../Models/CourseProject";
import { Course } from "../Models/Course";
import { CourseSchedule, SubmissionDate } from "../Models/CourseSchedule";
import { Term } from "../Models/Term";

/**
 * Factory for creating Serializables in a way specific to the sqlite database.
 */
export class DatabaseSerializableFactory implements SerializableFactory {
	protected db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async create(className: string, id?: number): Promise<Serializable> {
		/** @todo extend for all classes. */
		if (className === "User") {
			return await this.createEntityIn(User, "users", id);
		} else if (className === "CourseProject") {
			return await this.createEntityIn(CourseProject, "projects", id);
		} else if (className === "Course") {
			return await this.createEntityIn(Course, "courses", id);
		} else if (className === "CourseSchedule") {
			return await this.createEntityIn(CourseSchedule, "schedules", id);
		} else if (className === "SubmissionDate") {
			return await this.createEntityIn(SubmissionDate, "submissions", id);
		} else if (className === "Term") {
			return await this.createEntityIn(Term, "terms", id);
		} else {
			throw new Error("Serializable Creation Failed: Unknown class name: " + className);
		}
	}

	/**
	 * Creates a new Serializable entity and its corresponding database entity.
	 * Will overwrite the Databases Default Values with any defaults from
	 * entitys class and its constructor!
	 * @param EntityClass Class/constructor for the entity (e.g. User).
	 * @param tableName Name of the Table to add the entity to.
	 */
	protected async createEntityIn<T extends User | CourseProject | Course | CourseSchedule | SubmissionDate | Term>(
		EntityClass: new (id: number) => T,
		tableName: string,
		id?: number,
	): Promise<T> {
		// Create new entity row. If an id was provided, use it; otherwise use DEFAULT VALUES to let
		// the database generate an autoincrement id.
		let newId: number | undefined;
		if (typeof id === "number") {
			// Insert a row with the given id. Use INSERT OR IGNORE to avoid conflicts if the id already exists.
			await this.db.run(`INSERT OR IGNORE INTO ${tableName} (id) VALUES (?)`, [id]);
			newId = id;
		} else {
			const runResult = await this.db.run(`INSERT INTO ${tableName} DEFAULT VALUES`);
			if (!runResult || runResult.lastID === undefined) {
				throw new Error("Serializable Creation Failed: Failed to create db entry for new entity!");
			}
			newId = runResult.lastID as number;
		}

		const e = new EntityClass(newId as number);
		// Persist default attributes of the newly created object using DatabaseWriter so that
		// any non-null defaults from the class are written to the DB row immediately.
		const writer = new DatabaseWriter(this.db);
		await writer.writeRoot(e);
		return e;
	}
}
