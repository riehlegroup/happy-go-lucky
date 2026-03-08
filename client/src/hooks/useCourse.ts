import { useState } from "react";
import { Course, Project } from "@/components/Administration/Course/types";
import courseApi from "@/components/Administration/Course/api";
import { Message } from "@/components/Administration/Course/components/CourseMessage";
import { en as messages } from "@/messages";

const DEFAULT: Course = {
  id: 0,
  termId: 0,
  courseName: "",
  projects: [],
  studentsCanCreateProject: false,
};

/**
 * Course hook `useCourse` manages related operations in a Course components.
 * It provides functionality to get, create, update, and delete courses, as well as
 * manage course projects. It also handles user feedback messages.
 */
export const useCourse = () => {
  const [courses, setCourses] = useState<Course[]>([]);
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

  const getCourses = async (): Promise<Course[]> => {
    try {
      const response = await courseApi.getCourses();
      if (!response) return [];

      const validCourses = response.map((course) => ({
        id: course.id ?? 0,
        termId: course.termId ?? 0,
        courseName: course.courseName ?? "",
        projects: course.projects ?? [],
        studentsCanCreateProject: course.studentsCanCreateProject ?? false,
      }));

      setCourses(validCourses);
      return validCourses;
    } catch (error) {
      console.error("Error fetching courses:", error);
      return [];
    }
  };

  const createCourse = async (course: Course) => {
    setMessage(null);

    const body = {
      termId: course.termId,
      courseName: course.courseName,
      studentsCanCreateProject: course.studentsCanCreateProject,
    };

    try {
      await courseApi.createCourse(body);
      showMessage(messages.course.create.success(course.courseName), "success");
    } catch (error) {
      showMessage(
        messages.course.create.failure(course.courseName, error),
        "error",
      );
    }
  };

  // This method is not implemented yet
  const updateCourse = async (course: Course) => {
    if (!course) return;
    setMessage(null);

    const body = {
      id: course.id,
      termId: course.termId,
      courseName: course.courseName,
      studentsCanCreateProject: course.studentsCanCreateProject,
    };

    try {
      await courseApi.updateCourse(body);
      showMessage(messages.course.update.success(course.courseName), "success");
    } catch (error) {
      showMessage(
        messages.course.update.failure(course.courseName, error),
        "error",
      );
    }
  };

  // This method is not implemented yet
  const deleteCourse = async (course: Course) => {
    if (!course) return;
    setMessage(null);

    try {
      await courseApi.deleteCourse(course.id);
      showMessage(messages.course.delete.success(course.courseName), "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Delete course error:", errorMessage);

      // Try to parse JSON error message, fall back to simple message
      let displayMessage = messages.course.delete.failure(course.courseName);
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.message) displayMessage = parsed.message;
      } catch {
        // Use default message
      }

      showMessage(displayMessage, "error", false); // Don't auto-hide errors
    }
  };

  const getCourseProjects = async (course: Course): Promise<Project[]> => {
    try {
      const response = await courseApi.getCourseProjects(course.id);
      if (!response) return [];

      const projects: Project[] = response.map((proj) => ({
        id: proj.id,
        projectName: proj.projectName,
        courseId: proj.courseId,
        studentsCanJoinProject: proj.studentsCanJoinProject ?? false,
      }));

      // Correctly update state without mutating existing state directly using spread operator to expand iterable elements
      setCourses((prevCourses) =>
        prevCourses.map((c) =>
          c.id === course.id
            ? { ...c, projects: [...c.projects, ...projects] }
            : c,
        ),
      );

      return projects;
    } catch (error) {
      throw error;
    }
  };

  const addProject = async (project: Project) => {
    setMessage(null);

    const body = {
      courseId: project.courseId,
      projectName: project.projectName,
      studentsCanJoinProject: project.studentsCanJoinProject,
    };

    try {
      await courseApi.addProject(body);
      showMessage(
        messages.course.addProject.success(project.projectName),
        "success",
      );
    } catch (error) {
      showMessage(
        messages.course.addProject.failure(
          project.projectName,
          project.courseId,
          error,
        ),
        "error",
      );
    }
  };

  const updateProject = async (project: Project) => {
    if (!project) return;
    setMessage(null);

    const body = {
      projectName: project.projectName,
      courseId: project.courseId,
    };

    try {
      await courseApi.updateProject(project.id, body);
      showMessage(
        messages.course.updateProject.success(project.projectName),
        "success",
      );
    } catch (error) {
      showMessage(
        messages.course.updateProject.failure(project.projectName, error),
        "error",
      );
    }
  };

  const deleteProject = async (project: Project) => {
    if (!project) return;
    setMessage(null);

    try {
      await courseApi.deleteProject(project.id);
      showMessage(
        messages.course.deleteProject.success(project.projectName),
        "success",
      );
    } catch (error) {
      showMessage(
        messages.course.deleteProject.failure(project.projectName, error),
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
    courses,
    setCourses,
    getCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourseProjects,
    addProject,
    updateProject,
    deleteProject,
  };
};
