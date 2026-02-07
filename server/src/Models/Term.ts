import { Reader } from "../Serializer/Reader";
import { Serializable } from "../Serializer/Serializable";
import { Writer } from "../Serializer/Writer";
import { Course } from "./Course";
import { TermName } from "../ValueTypes/TermName";

export class Term implements Serializable {
  protected id: number;
  protected termName: TermName | null = null;
  protected displayName: string | null = null;
  protected courses: Course[] = []; // 1:N relationship

  constructor(id: number) {
    this.id = id;
  }

  async readFrom(reader: Reader): Promise<void> {
    this.id = reader.readNumber("id") as number;
    const termNameStr = reader.readString("termName");

    // Legacy/compat handling:
    // Older persisted data may contain term names that fail newer validation
    // rules (e.g. illogical ranges like "WS2025/24"). Reading such rows should
    // not crash the server; instead we try a legacy-tolerant parse and fall
    // back to null if it still cannot be interpreted.
    if (!termNameStr) {
      this.termName = null;
    } else {
      const parsed = TermName.tryFromString(termNameStr);
      if (parsed.ok) {
        this.termName = parsed.value;
        if (parsed.wasLegacy) {
          // Intentionally warn (not throw): this signals a migration candidate.
          console.warn(
            `[legacy-data] Term ${this.id} has non-conforming termName "${termNameStr}". ` +
              `Loaded using legacy parsing; consider migrating this value.`
          );
        }
      } else {
        this.termName = null;
        console.warn(
          `[legacy-data] Term ${this.id} has invalid termName "${termNameStr}". ` +
            `Loaded with termName=null; consider migrating/fixing this row.`
        );
      }
    }
    this.displayName = reader.readString("displayName");
    this.courses = (await reader.readObjects("termId", "courses")) as Course[];
  }

  writeTo(writer: Writer): void {
    writer.writeNumber("id", this.id);
    writer.writeString("termName", this.termName ? this.termName.toString() : null);
    writer.writeString("displayName", this.displayName);
  }

  // Getters
  public getId(): number {
    return this.id;
  }

  public getTermName(): TermName | null {
    return this.termName;
  }

  public getDisplayName(): string | null {
    return this.displayName;
  }

  public getCourses(): Course[] {
    return [...this.courses];
  }

  // Setters
  public setTermName(termName: TermName | null) {
    this.termName = termName;
  }

  public setDisplayName(displayName: string | null) {
    this.displayName = displayName;
  }

  // Composition methods for Course (1:N)
  public addCourse(course: Course): void {
    this.courses.push(course);
  }

  public removeCourse(course: Course | number): boolean {
    if (typeof course === "number") {
      const index = this.courses.findIndex(c => c.getId() === course);
      if (index !== -1) {
        this.courses.splice(index, 1);
        return true;
      }
      return false;
    } else {
      const index = this.courses.indexOf(course);
      if (index !== -1) {
        this.courses.splice(index, 1);
        return true;
      }
      return false;
    }
  }

  public findCourseById(courseId: number): Course | undefined {
    return this.courses.find(course => course.getId() === courseId);
  }
}
