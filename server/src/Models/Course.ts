import { Reader } from "../Serializer/Reader";
import { Serializable } from "../Serializer/Serializable";
import { Writer } from "../Serializer/Writer";
import { CourseFeature } from "./CourseFeature";
import { CourseProject } from "./CourseProject";
import { CourseSchedule } from "./CourseSchedule";
import { Term } from "./Term";

export class Course implements Serializable {
  protected id: number;
  protected name: string | null = null;
  protected term: Term | null = null;
  protected studentsCanCreateProject: number = 0;
  protected projects: CourseProject[] = []; // 1:N
  protected schedule: CourseSchedule | null = null; // 1:1
  protected enabledFeatures: CourseFeature[] = []; // List of enabled features for the course
  constructor(id: number) {
    this.id = id;
  }

  async readFrom(reader: Reader): Promise<void> {
    this.id = reader.readNumber("id") as number;
    this.name = reader.readString("courseName");
    this.studentsCanCreateProject = reader.readNumber("studentsCanCreateProject") as number;
    this.term = (await reader.readObject("termId", "Term")) as Term;
    this.projects = (await reader.readObjects("courseId", "projects")) as CourseProject[];

    try {
      // Older rows may not have the new column yet, so fall back to an empty feature list.
      const enabledFeatures = reader.readString("enabledFeatures");
      this.enabledFeatures = enabledFeatures ? JSON.parse(enabledFeatures) : [];
    } catch {
      this.enabledFeatures = [];
    }
  }

  writeTo(writer: Writer): void {
    writer.writeNumber("id", this.id);
    writer.writeString("courseName", this.name);
    writer.writeNumber("studentsCanCreateProject", this.studentsCanCreateProject);
    writer.writeObject<Term>("termId", this.term);
  }

  // Getters
  public getId(): number {
    return this.id;
  }

  public getName(): string | null {
    return this.name;
  }

  public getTerm(): Term | null {
    return this.term;
  }

  public getStudentsCanCreateProject(): boolean{
    return this.studentsCanCreateProject === 1;
  }

  public getProjects(): CourseProject[] {
    // Return a copy of the array to prevent direct modification
    return [...this.projects];
  }

  public getEnabledFeatures(): CourseFeature[] {
    return this.enabledFeatures;
  }


  // Setters
  public setName(name: string | null) {
    this.name = name;
  }

  public setTerm(term: Term | null): void {
    this.term = term;
  }

  public setEnabledFeatures(features: CourseFeature[]): void {
    this.enabledFeatures = features;
  }

  // Composition methods for CourseProject (1:N)
  public addProject(project: CourseProject): void {
    this.projects.push(project);
  }
  
  public removeProject(project: CourseProject | number): boolean {
    if (typeof project === "number") {
      const index = this.projects.findIndex(p => p.getId() === project);
      if (index !== -1) {
        this.projects.splice(index, 1);
        return true;
      }
      return false;
    } else {
      const index = this.projects.indexOf(project);
      if (index !== -1) {
        this.projects.splice(index, 1);
        return true;
      }
      return false;
    }
  }

  public findProjectById(projectId: number): CourseProject | undefined {
    return this.projects.find(project => project.getId() === projectId);
  }
}
