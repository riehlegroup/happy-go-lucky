import { Database } from "sqlite";
import { User } from "./Models/User";
import { CourseProject } from "./Models/CourseProject";
import { CourseSchedule, SubmissionDate } from "./Models/CourseSchedule";
import { Course } from "./Models/Course";
import { Term } from "./Models/Term";
import { DatabaseResultSetReader } from "./Serializer/DatabaseResultSetReader";
import { Serializable } from "./Serializer/Serializable";

export class ObjectHandler {

    public async getUserCount(db: Database): Promise<number | undefined> {
        return (await db.get('SELECT COUNT(*) AS count FROM users')).count;
    }


    public async getUser(id: number, db: Database): Promise<User | null> {
        const userRow = await db.get('SELECT * FROM users WHERE id = ?', [id]);
        if (!userRow) {
            return null;
        }
        // Creates a User instance and fills it with attribute values.
        return (new DatabaseResultSetReader(userRow, db)).readRoot<User>(User) as Promise<User>; 
    }

    public async getUserByMail(email: string, db: Database): Promise<User | null> {
        const userRow = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!userRow) {
            return null;
        }
        // Creates a User instance and fills it with attribute values.
        return (new DatabaseResultSetReader(userRow, db)).readRoot<User>(User) as Promise<User>; 
    }

    public async getCourseProject(id: number, db: Database): Promise<CourseProject | null> {
        const projectRow = await db.get('SELECT * FROM projects WHERE id = ?', [id]);
        if (!projectRow) {
            return null;
        }
        // Creates a CourseProject instance and fills it with attribute values.
        return (new DatabaseResultSetReader(projectRow, db)).readRoot<CourseProject>(CourseProject) as Promise<CourseProject>; 
    }

    public async getCourseSchedule(id: number, db: Database): Promise<CourseSchedule | null> {
        const scheduleRow = await db.get('SELECT * FROM schedules WHERE id = ?', [id]);
        if (!scheduleRow) {
            return null;
        }

        return (new DatabaseResultSetReader(scheduleRow, db))
            .readRoot<CourseSchedule>(CourseSchedule) as Promise<CourseSchedule>;
    }

    public async getSubmissionDates(scheduleId: number, db: Database): Promise<SubmissionDate[]> {
        const dates = db.all('SELECT * FROM submissions WHERE scheduleId = ? ORDER BY submissionDate ASC', [scheduleId]);

        return (new DatabaseResultSetReader(dates, db))
            .readRoot<SubmissionDate>(SubmissionDate) as Promise<SubmissionDate[]>;
    }

    public async getCourse(id: number, db: Database): Promise<Course | null> {
        const courseRow = await db.get('SELECT * FROM courses WHERE id = ?', [id]);
        if (!courseRow) {
            return null;
        }
        // Creates a Course instance and fills it with attribute values.
        return (new DatabaseResultSetReader(courseRow, db)).readRoot<Course>(Course) as Promise<Course>;
    }

    public async getTerm(id: number, db: Database): Promise<Term | null> {
        const termRow = await db.get('SELECT * FROM terms WHERE id = ?', [id]);
        if (!termRow) {
            return null;
        }
        return (new DatabaseResultSetReader(termRow, db)).readRoot<Term>(Term) as Promise<Term>;
    }

    async getSerializableFromId(id: number, className: string, db: Database): Promise<Serializable | null> {
        switch (className) {
            case "User":
                return this.getUser(id, db);
            case "Course":
                return this.getCourse(id, db);
            case "CourseProject":
                return this.getCourseProject(id, db);
            case "Term":
                return this.getTerm(id, db);
            default:
                return null;
        }
    }

    // For 1 to n relations
    async getSerializablesFromId(id: number, className: string, db: Database): Promise<Serializable[]> {
        switch (className) {
            case "SubmissionDate":
                return this.getSubmissionDates(id, db);
            default:
                return []
        }
    }
}