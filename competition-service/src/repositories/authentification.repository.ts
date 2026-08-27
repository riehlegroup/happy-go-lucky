import { Database } from "sqlite";
import { BaseRepo } from "./base.repository";
import { DatabaseUser } from "../types/user.types";

export class AuthentificationRepo extends BaseRepo<DatabaseUser> {
  constructor(db: Database) {
    super(db, "users");
  }

  async isUserInCourse(userId: number, courseId: number): Promise<boolean> {
    const sql = `SELECT COUNT(*) as count FROM user_courses WHERE user_id = ? AND course_id = ?`;
    const result = await this.db.get(sql, [userId, courseId]);
    return result.count > 0;
  }

  async userIsInCourse(userId: number, courseId: number): Promise<boolean> {
    const sql = `SELECT COUNT(*) as count 
    FROM user_projects JOIN projects ON user_projects.projectId = projects.id 
    WHERE userId = ? AND projects.courseId = ?`;
    const result = await this.db.get(sql, [userId, courseId]);
    return result.count > 0;
  }
}
