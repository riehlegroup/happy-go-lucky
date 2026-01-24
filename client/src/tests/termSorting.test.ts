import { describe, it, expect } from "vitest";
import { Term } from "@/components/Administration/Term/types";
import { Course, Project } from "@/components/Administration/Course/types";
import { sortTermsChronologically, _internals, TermSortDirection } from "@/utils/termSorting";

const { parseTerm, compareTerms } = _internals;

describe("Term sorting utilities", () => {

  describe("parseTerm", () => {

    it("parses short fomats correctly", () => {
      expect(parseTerm("SS24")).toStrictEqual({semester: "SS", year: 2024})
      expect(parseTerm("WS24")).toStrictEqual({semester: "WS", year: 2024})
    });

    it("parses winter semester with slash", () => {
      expect(parseTerm("WS24/25")).toStrictEqual({ semester: "WS", year: 2024 });
    });

    it("parses long formats correctly", () => {
      expect(parseTerm("Winter 2024")).toStrictEqual({ semester: "WS", year: 2024 });
      expect(parseTerm("Summer 2025")).toStrictEqual({ semester: "SS", year: 2025 });
    });
    
    it("returns null for invalid formats", () => {
      expect(parseTerm("Autumn 2024")).toBeNull();
      expect(parseTerm("24SS")).toBeNull();
      expect(parseTerm("")).toBeNull();
      expect(parseTerm(undefined as any)).toBeNull();
    });
  });

  describe("compareTerms", () => {

    it("orders by year first, semester second", () => {
      // Old-to-new
      expect(compareTerms("WS24", "WS25", true)).toBe(-1);  // 2024 before 2025
      expect(compareTerms("WS25", "WS24", true)).toBe(1);   // 2025 after 2024
      expect(compareTerms("SS24", "WS24", true)).toBe(-1);  // SS before WS
      expect(compareTerms("WS24", "SS24", true)).toBe(1)    // WS after SS

      // New-to-old (inverted behavior)
      expect(compareTerms("WS24", "WS25", false)).toBe(1);  // 2024 after 2025
      expect(compareTerms("WS25", "WS24", false)).toBe(-1);   // 2025 before 2024
      expect(compareTerms("SS24", "WS24", false)).toBe(1);  // SS after WS
      expect(compareTerms("WS24", "SS24", false)).toBe(-1)    // WS before SS
    });

    it("returns 0 for equal terms", () => {
      expect(compareTerms("SS24", "SS24", true)).toBe(0);
      expect(compareTerms("WS24", "WS24", false)).toBe(0);
      // Compatibility between formats:
      expect(compareTerms("SS24", "Summer 2024")).toBe(0);
      expect(compareTerms("WS24", "WS24/25")).toBe(0);    
      expect(compareTerms("WS24", "Winter 2024")).toBe(0);

      expect(compareTerms("Summer 2024", "SS24")).toBe(0);
      expect(compareTerms("WS24/25", "WS24")).toBe(0);    
      expect(compareTerms("Winter 2024", "WS24")).toBe(0);
    });

    it("returns 0 if parsing fails", () => {
      expect(compareTerms("invalid", "WS24")).toBe(0);
      expect(compareTerms("SS24", "unknown")).toBe(0);
    });
  });

  describe("sortTermsChronologically", () => {
    const project: Project = {id: 0, projectName: "dummy project", courseId: 0, studentsCanJoinProject: false};
    const course: Course = {id: 0, termId: 1, courseName: "dummy course", projects: [project], studentsCanCreateProject: false};

    const terms: Term[] = [
      { id: 1, termName: "WS24", displayName: "Winter 2024",  courses: [course] },
      { id: 2, termName: "SS24", displayName: "Summer 2024",  courses: [course] },
      { id: 3, termName: "WS23", displayName: "Winter 2023",  courses: [course] },
      { id: 4, termName: "SS25", displayName: "Summer 2025",  courses: [course] },
      { id: 5, termName: "WS25", displayName: "Winter 2025", courses: [course] },
      { id: 6, termName: "SS26", displayName: "Summer 2026", courses: [course] },
      { id: 7, termName: "WS26", displayName: "Winter 2026", courses: [course] },
      { id: 8, termName: "SS23", displayName: "Summer 2023", courses: [course] },
    ];

    it("sorts from old to new", () => {
      const sorted = sortTermsChronologically(terms, TermSortDirection.OLD_TO_NEW);
      const names = sorted.map(t => t.termName);
      expect(names).toStrictEqual(["SS23","WS23","SS24","WS24","SS25","WS25","SS26","WS26"])
    });

    it("sorts from new to old", ()=>{
      const sorted = sortTermsChronologically(terms, TermSortDirection.NEW_TO_OLD);
      const names = sorted.map(t => t.termName);
      expect(names).toStrictEqual(["SS23","WS23","SS24","WS24","SS25","WS25","SS26","WS26"].reverse())
    });

    it("does not mutate original array", () => {
      const copy = [...terms];
      sortTermsChronologically(terms, TermSortDirection.OLD_TO_NEW);
      expect(terms).toStrictEqual(copy);
    });
  });
});