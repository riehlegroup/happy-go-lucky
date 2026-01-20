import { Database } from "sqlite";
import { User } from "../Models/User";
import { CourseProject } from "../Models/CourseProject";
import { ObjectHandler } from "../ObjectHandler";
import { ProjectParticipation } from "../Models/ProjectParticipation";
import { ProjectMember } from "../Models/ProjectMember";
import { DatabaseSerializableFactory } from "../Serializer/DatabaseSerializableFactory";
import { IManager } from "./IManager";


/**
 * This class manages the n:m relation between CourseProject and User.
 * Serializing this is a nightmare, so we are using a direct approach querying the db.
 * Please treat all outputs of this classes methods as readonly immutables.
 * Only use the setter and command methods to change the relation!
 */
export class ProjectManager implements IManager {
    protected db: Database;
    protected oh: ObjectHandler;

    constructor(db: Database, oh: ObjectHandler) {
        this.db = db;
        this.oh = oh;
    }

    public async createProject (): Promise<CourseProject> {
        const dbsf = new DatabaseSerializableFactory(this.db);
        const proj = await dbsf.create("CourseProject") as CourseProject;
        return proj;
    }

    public async getProjectParticipations (user: User):  Promise<ProjectParticipation[]> {
        const userProjects = await this.db.all(`
            SELECT projectId, role, url
            FROM user_projects
            WHERE userId = ?
        `, user.getId());
        const projParts = new Array<ProjectParticipation>;
        for (const row of userProjects) {
            const proj = await this.oh.getCourseProject(row.projectId, this.db);
            if (proj == null ) {
                continue;
            }
            projParts.push(new ProjectParticipation(proj, row.role, row.url));
        }
        return projParts;
    }

    public async getProjectMembers (project: CourseProject): Promise<ProjectMember[]>{
        const userProjects = await this.db.all(`
            SELECT userId, role, url
            FROM user_projects
            WHERE projectId = ?
        `, project.getId());
        const projMems = new Array<ProjectMember>;
        for (const row of userProjects) {
            const user = await this.oh.getUser(row.userId, this.db);
            if (user == null ) {
                continue;
            }
            projMems.push(new ProjectMember(user, row.role, row.url));
        }
        return projMems;
    }

    public async isMemberIn(user: User, project: CourseProject): Promise<boolean> {
        const userProject = await this.db.get(`
            SELECT * 
            FROM user_projects
            WHERE userId = ? AND projectId = ?
        `, [user.getId(), project.getId()]);
        if (!userProject) {
            return false;
        }
        return true;
    }

    public async joinProject (user: User, project: CourseProject, role: string | null = null, url: string | null = null) {
        if (!await this.isMemberIn(user, project)) {
            await this.db.run(`
                INSERT INTO user_projects (userId, projectId, role, url)
                VALUES (?, ?, ?, ?)  
            `, [user.getId(), project.getId(), role, url]);
        }
    }

    public async leaveProject (user: User, project: CourseProject) {
        if (await this.isMemberIn(user, project)) {
            await this.db.run(`
                DELETE FROM user_projects
                WHERE userId = ? AND projectId = ?}
            `, [user.getId(), project.getId()]);
        }
    }

    public async getRoleIn(user: User, project: CourseProject): Promise<string | null>{
        const userProjects = await this.db.get(`
            SELECT role
            FROM user_projects
            WHERE userId = ? AND projectId = ?
        `, [user.getId(), project.getId()]);
        if (!userProjects){
            throw new Error("No Course participation found!");
        }
        return userProjects.role;
    }

    public async setRoleIn(user: User, project: CourseProject, role: string | null) {
        if (!await this.isMemberIn(user, project)){
            throw new Error("No Course participation found!");
        }
        await this.db.run(`
            UPDATE user_projects
            SET role = ?
            WHERE userId = ? AND projectId = ?
        `, [role, user.getId(), project.getId()]);
    }
    
    public async getUserProjectUrl(user: User, project: CourseProject): Promise<string | null> {
        const userProjects = await this.db.get(`
            SELECT url
            FROM user_projects
            WHERE userId = ? AND projectId = ?
        `, [user.getId(), project.getId()]);
        if (!userProjects){
            throw new Error("No Course participation found!");
        }
        return userProjects.url;
    }

    public async setUserProjectUrl(user: User, project: CourseProject, url: string | null) {
        if (!await this.isMemberIn(user, project)){
            throw new Error("No Course participation found!");
        }
        await this.db.run(`
            UPDATE user_projects
            SET url = ?
            WHERE userId = ? AND projectId = ?
        `, [url, user.getId(), project.getId()]);
    }
}
