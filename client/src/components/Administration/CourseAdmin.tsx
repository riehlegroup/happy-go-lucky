import { useState, useEffect, useMemo, useCallback } from "react";
import TopNavBar from "../common/TopNavBar";
import Table from "../common/Table";
import SectionCard from "@/components/common/SectionCard";
import CourseWidget from "./Course/CourseWidget";
import TermWidget from "./Term/TermWidget";
import { useCourse } from "@/hooks/useCourse";
import { useTerm } from "@/hooks/useTerm";
import { Course, Project } from "./Course/types";
import CourseMessage from "./Course/components/CourseMessage";
import TermMessage from "./Term/components/TermMessage";
import { en as messages } from "@/messages";

/**
 * Course Admin panel for managing courses and their projects.
 * Handles course or project fetching, and table rendering.
 */
const CourseAdmin: React.FC = () => {
  const {
    courses,
    getCourses,
    getCourseProjects,
    message,
    clearMessage,
    deleteCourse,
  } = useCourse();
  const {
    terms,
    getTerms,
    message: termMessage,
    clearMessage: clearTermMessage,
    deleteTerm,
  } = useTerm();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchCourseProjects = useCallback(
    async (courses: Course[]) => {
      try {
        const projPromises = courses.map(async (course) => {
          const cp = await getCourseProjects(course);
          return cp;
        });

        // fetch projects concurrently
        const result = await Promise.all(projPromises);
        const projects = result.flat();
        setProjects(projects);
      } catch (err) {
        console.error(err);
      }
    },
    [getCourseProjects],
  );

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    try {
      await getTerms();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getTerms]);

  const fetchCourse = useCallback(async () => {
    setLoading(true);

    try {
      const course = await getCourses();
      await fetchCourseProjects(course);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getCourses, fetchCourseProjects]);

  const tableTerms = useMemo(() => {
    return terms.map((term) => [
      term.id,
      term.termName,
      term.displayName,
      <div key={term.id} className="flex flex-wrap gap-2">
        <TermWidget
          type="course"
          label={messages.admin.courseAdmin.actions.addCourse}
          action="add"
          term={term}
          onFetch={fetchCourse}
        />
        <TermWidget
          type="term"
          label={messages.admin.courseAdmin.actions.delete}
          action="delete"
          term={term}
          onFetch={fetchTerms}
          onDeleteTerm={deleteTerm}
        />
      </div>,
    ]);
  }, [terms, fetchCourse, fetchTerms, deleteTerm]);

  const tableCourse = useMemo(() => {
    return courses.map((course) => {
      const term = terms.find((t) => t.id === course.termId);
      return [
        course.id,
        term?.termName || course.termId,
        course.courseName,
        <div key={course.id} className="flex flex-wrap gap-2">
          <CourseWidget
            type="project"
            label={messages.admin.courseAdmin.actions.addProject}
            action="add"
            course={course}
            onFetch={fetchCourse}
          />
          <CourseWidget
            type="schedule"
            label={messages.admin.courseAdmin.actions.schedule}
            action="schedule"
            course={course}
          />
          <CourseWidget
            type="course"
            label={messages.admin.courseAdmin.actions.delete}
            action="delete"
            course={course}
            onFetch={fetchCourse}
            onDeleteCourse={deleteCourse}
          />
        </div>,
      ];
    });
  }, [courses, terms, fetchCourse, deleteCourse]);

  const tableProjects = useMemo(() => {
    return projects.map((prj) => {
      const parentCourse = courses.find((c) => c.id === prj.courseId);
      return [
        prj.id,
        prj.projectName,
        prj.courseId,
        <div key={prj.id} className="flex flex-wrap gap-2">
          <CourseWidget
            type="project"
            label={messages.admin.courseAdmin.actions.edit}
            action="edit"
            course={parentCourse}
            project={prj}
            onFetch={fetchCourse}
          />
          <CourseWidget
            type="project"
            label={messages.admin.courseAdmin.actions.delete}
            action="delete"
            course={parentCourse}
            project={prj}
            onFetch={fetchCourse}
          />
        </div>,
      ];
    });
  }, [projects, courses, fetchCourse]);

  useEffect(() => {
    fetchTerms();
    fetchCourse();
  }, []); // fetch terms and courses only on mount

  return (
    <div className="min-h-screen">
      <TopNavBar
        title={messages.admin.courseAdmin.pageTitle}
        showBackButton={true}
        showUserInfo={true}
      />

      <div className="mx-auto max-w-6xl space-y-4 p-4 pt-16">
        {/* Display message if present */}
        {message && (
          <div
            className={`relative rounded-md border p-4 shadow-sm ${
              message.type === "error"
                ? "border-red-300 bg-red-50"
                : message.type === "success"
                  ? "border-green-300 bg-green-50"
                  : "border-blue-300 bg-blue-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <CourseMessage message={message} />
              <button
                onClick={clearMessage}
                className="shrink-0 rounded-md p-1 hover:bg-gray-200"
                aria-label={messages.admin.courseAdmin.aria.dismissMessage}
              >
                <svg
                  className="size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Display term message if present */}
        {termMessage && (
          <div
            className={`relative rounded-md border p-4 shadow-sm ${
              termMessage.type === "error"
                ? "border-red-300 bg-red-50"
                : termMessage.type === "success"
                  ? "border-green-300 bg-green-50"
                  : "border-blue-300 bg-blue-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <TermMessage message={termMessage} />
              <button
                onClick={clearTermMessage}
                className="shrink-0 rounded-md p-1 hover:bg-gray-200"
                aria-label={messages.admin.courseAdmin.aria.dismissMessage}
              >
                <svg
                  className="size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Terms Section */}
        <SectionCard
          title={messages.admin.courseAdmin.sections.termsTitle(terms.length)}
        >
          <Table
            headings={[
              messages.admin.courseAdmin.tables.termsHeadings.id,
              messages.admin.courseAdmin.tables.termsHeadings.termName,
              messages.admin.courseAdmin.tables.termsHeadings.displayName,
              messages.admin.courseAdmin.tables.termsHeadings.action,
            ]}
            loading={isLoading}
            loadData={() => {
              fetchTerms();
            }}
            data={tableTerms}
            rowsPerPage={9}
          >
            <TermWidget
              label={messages.admin.courseAdmin.actions.create}
              action="add"
              onFetch={fetchTerms}
            />
          </Table>
        </SectionCard>

        {/* Course Section */}
        <SectionCard
          title={messages.admin.courseAdmin.sections.coursesTitle(
            courses.length,
          )}
        >
          <Table
            headings={[
              messages.admin.courseAdmin.tables.coursesHeadings.id,
              messages.admin.courseAdmin.tables.coursesHeadings.term,
              messages.admin.courseAdmin.tables.coursesHeadings.name,
              messages.admin.courseAdmin.tables.coursesHeadings.action,
            ]}
            loading={isLoading}
            loadData={() => {
              fetchCourse();
            }}
            data={tableCourse}
            rowsPerPage={9}
          >
            <CourseWidget
              label={messages.admin.courseAdmin.actions.create}
              action="add"
              onFetch={fetchCourse}
            />
          </Table>
        </SectionCard>

        {/* Project Section */}
        <SectionCard
          title={messages.admin.courseAdmin.sections.projectsTitle(
            projects.length,
          )}
        >
          {projects && projects.length > 0 ? (
            <Table
              headings={[
                messages.admin.courseAdmin.tables.projectsHeadings.id,
                messages.admin.courseAdmin.tables.projectsHeadings.projectName,
                messages.admin.courseAdmin.tables.projectsHeadings.courseId,
                messages.admin.courseAdmin.tables.projectsHeadings.actions,
              ]}
              loading={isLoading}
              loadData={() => {
                fetchCourseProjects(courses);
              }}
              data={tableProjects}
              rowsPerPage={9}
            />
          ) : (
            <p className="text-slate-500">
              {messages.admin.courseAdmin.empty.noProjectsFound}
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
};
export default CourseAdmin;
