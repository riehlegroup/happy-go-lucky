import { Reader } from "../Serializer/Reader";
import { Serializable } from "../Serializer/Serializable";
import { Writer } from "../Serializer/Writer";
import { CourseProject } from "./CourseProject";
import { CourseSchedule } from "./CourseSchedule";
import { Term } from "./Term";

export class Course implements Serializable {
  protected id: number;
  protected name: string | null = null;
  protected term: Term | null = null;
  protected projects: CourseProject[] = []; // 1:N
  protected schedule: CourseSchedule | null = null; // 1:1
  constructor(id: number) {
    this.id = id;
  }

  async readFrom(reader: Reader): Promise<void> {
    this.id = reader.readNumber("id") as number;
    this.name = reader.readString("courseName");
    this.term = (await reader.readObject("termId", "Term")) as Term;
    this.projects = (await reader.readObjects("courseId", "projects")) as CourseProject[];
  }

  writeTo(writer: Writer): void {
    writer.writeNumber("id", this.id);
    writer.writeString("courseName", this.name);
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

  public getProjects(): CourseProject[] {
    // Return a copy of the array to prevent direct modification
    return [...this.projects];
  }

  // Setters
  public setName(name: string | null) {
    this.name = name;
  }

  public setTerm(term: Term | null): void {
    this.term = term;
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
