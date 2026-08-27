import { describe, it, expect, vi, beforeEach, expectTypeOf } from "vitest";
import * as React from "react";
import courseApi from "@/components/Administration/Course/api";
import { useCourse } from "@/hooks/useCourse";
import { Course } from "@/components/Administration/Course/types";
import { Message } from "@/components/Administration/Course/components/CourseMessage";
import { CourseFeature } from "@/types/CourseFeature";

// Mock Api before imports
vi.mock("@/components/Administration/Course/api", () => ({
  default: {
    getCourses: vi.fn(),
    createCourse: vi.fn(),
    updateCourse: vi.fn(),
    deleteCourse: vi.fn(),
    getCourseProjects: vi.fn(),
    addProject: vi.fn(),
  },
}));

// Mock Reacts useState
vi.mock("react", async () => {
  const actual = await vi.importActual("react");

  // Create a simple state store that will be used by the mocked useState
  const states = new Map();
  let stateId = 0;

  return {
    ...(actual as typeof React),
    useState: vi.fn((initialValue) => {
      const id = stateId++;

      // Initialize this state slot if it doesn't exist yet
      if (!states.has(id)) {
        states.set(id, initialValue);
      }

      // Create a setter function that supports both ways of updating the stored state
      const setState = vi.fn((newValue) => {
        const resolvedValue =
          typeof newValue === "function"
            ? newValue(states.get(id)) // functional updates
            : newValue; // uses the value directly
        states.set(id, resolvedValue);
      });

      return [states.get(id), setState];
    }),
  };
});

describe("useCourse", () => {
  // Access the mocked courseApi
  const mockApi = vi.mocked(courseApi);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize states and types", () => {
    const hook = useCourse();

    expect(hook.courses).toStrictEqual([]);
    expectTypeOf(hook.courses).toEqualTypeOf<Course[]>();

    expect(hook.message).toBe(null);
    expectTypeOf(hook.message).toEqualTypeOf<Message | null>();
  });

  it("should update courses when getter/setter are called ", async () => {
    const mockCourses = [
      {
        id: 1,
        termId: 1,
        courseName: "adapV2",
        projects: [],
        studentsCanCreateProject: false,
        enabledFeatures: [CourseFeature.HAPPINESS_INDEX, CourseFeature.STANDUPS],
      },
    ];

    // Mock successful API response
    mockApi.getCourses.mockResolvedValueOnce(mockCourses);

    const hook = useCourse();
    const result = await hook.getCourses();

    // Get the setCourses function from useState mock
    const setCourses = vi.mocked(React.useState).mock.results[0].value[1];

    // Verify result and state update
    expect(result).toEqual(mockCourses);
    expect(setCourses).toHaveBeenCalledWith(mockCourses);
  });

  it("should create course successfully", async () => {
    mockApi.createCourse.mockResolvedValueOnce(new Response());
    const hook = useCourse();
    const setMessage = vi.mocked(React.useState).mock.results[1].value[1];

    // Call method that should set a success message
    await hook.createCourse({
      id: 1,
      termId: 1,
      courseName: "adap",
      projects: [],
      studentsCanCreateProject: true,
      enabledFeatures: [CourseFeature.HAPPINESS_INDEX, CourseFeature.STANDUPS],
    });

    // Verify message was set correctly
    expect(setMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
      })
    );
  });

  it("should failed on create course successfully", async () => {
    // Mock API failure
    mockApi.createCourse.mockRejectedValueOnce(new Error("API Error"));
    const hook = useCourse();
    const setMessage = vi.mocked(React.useState).mock.results[1].value[1];

    await hook.createCourse({
      id: 1,
      termId: 1,
      courseName: "adapV2",
      projects: [],
      studentsCanCreateProject: false,
      enabledFeatures: [],
    });

    // Verify message was set correctly
    expect(setMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
      })
    );
  });

  it("should clear message after timeout", async () => {
    // Mock timer functions
    vi.useFakeTimers();

    mockApi.createCourse.mockResolvedValueOnce(new Response());
    const hook = useCourse();
    const setMessage = vi.mocked(React.useState).mock.results[1].value[1];
    await hook.createCourse({
      id: 1,
      termId: 1,
      courseName: "Test Course",
      projects: [],
      studentsCanCreateProject: false,
      enabledFeatures: [],
    });

    // Verify initial message was set
    expect(setMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
      })
    );

    // Reset the mock to check next call
    setMessage.mockClear();

    // Fast-forward past the timeout
    vi.advanceTimersByTime(3000);

    // Verify message was cleared
    expect(setMessage).toHaveBeenCalledWith(null);

    // Restore real timers
    vi.useRealTimers();
  });
});
