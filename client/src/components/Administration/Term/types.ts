import { Course } from "../Course/types";
import { TermName } from "@/valueTypes/TermName";

export interface TermDto {
  id: number;
  termName: string | null;
  displayName: string;
  courses: Course[];
}

export interface Term {
  id: number;
  termName: TermName | null;
  displayName: string;
  courses: Course[];
}
