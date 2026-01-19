import { useState } from "react";
import { Term } from "@/components/Administration/Term/types";
import { Course } from "@/components/Administration/Course/types";
import termApi from "@/components/Administration/Term/api";
import { Message } from "@/components/Administration/Course/components/CourseMessage";
import { en as messages } from "@/messages";

const DEFAULT: Term = {
  id: 0,
  termName: "",
  displayName: "",
  courses: [],
};

/**
 * Provides functionality to get, create, and delete terms, as well as
 * manage term courses. It also handles user feedback messages.
 */
export const useTerm = () => {
  const [terms, setTerms] = useState<Term[]>([]);
  const [message, setMessage] = useState<Message | null>(null);

  const showMessage = (
    text: string,
    type: "success" | "error" | "info",
    hide = true,
  ) => {
    setMessage({ text, type });
    if (hide) {
      setTimeout(() => {
        setMessage(null);
      }, 3000); // delay
    }
  };

  const getTerms = async (): Promise<Term[]> => {
    try {
      const response = await termApi.getTerms();
      if (!response) return [];

      const validTerms = response.map((term) => ({
        id: term.id ?? 0,
        termName: term.termName ?? "",
        displayName: term.displayName ?? "",
        courses: term.courses ?? [],
      }));

      setTerms(validTerms);
      return validTerms;
    } catch (error) {
      console.error("Error fetching terms:", error);
      return [];
    }
  };

  const createTerm = async (term: Term) => {
    setMessage(null);

    const body = {
      termName: term.termName,
      displayName: term.displayName,
    };

    try {
      await termApi.createTerm(body);
      showMessage(messages.term.create.success(term.termName), "success");
    } catch (error) {
      showMessage(messages.term.create.failure(term.termName, error), "error");
    }
  };

  const deleteTerm = async (term: Term) => {
    if (!term) return;
    setMessage(null);

    try {
      await termApi.deleteTerm(term.id);
      showMessage(messages.term.delete.success(term.termName), "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Delete term error:", errorMessage);

      // Try to parse JSON error message, fall back to simple message
      let displayMessage = messages.term.delete.failure(term.termName);
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.message) displayMessage = parsed.message;
      } catch {
        // Use default message
      }

      showMessage(displayMessage, "error", false); // Don't auto-hide errors
    }
  };

  const getTermCourses = async (term: Term): Promise<Course[]> => {
    try {
      const response = await termApi.getTermCourses(term.id);
      if (!response) return [];

      const courses: Course[] = response.map((course) => ({
        id: course.id,
        courseName: course.courseName,
        termId: course.termId,
        projects: course.projects ?? [],
        studentsCanCreateProject: course.studentsCanCreateProject ?? false,
      }));

      // Update state with courses for this term
      setTerms((prevTerms) =>
        prevTerms.map((t) =>
          t.id === term.id ? { ...t, courses: [...t.courses, ...courses] } : t,
        ),
      );

      return courses;
    } catch (error) {
      throw error;
    }
  };

  const addCourse = async (course: Course) => {
    setMessage(null);

    const body = {
      termId: course.termId,
      courseName: course.courseName,
    };

    try {
      await termApi.addCourse(body);
      showMessage(
        messages.course.addCourseToTerm.success(course.courseName),
        "success",
      );
    } catch (error) {
      showMessage(
        messages.course.addCourseToTerm.failure(
          course.courseName,
          course.termId,
          error,
        ),
        "error",
      );
    }
  };

  const clearMessage = () => {
    setMessage(null);
  };

  return {
    message,
    clearMessage,
    DEFAULT,
    terms,
    setTerms,
    getTerms,
    createTerm,
    deleteTerm,
    getTermCourses,
    addCourse,
  };
};
