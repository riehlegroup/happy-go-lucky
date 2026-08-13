import ApiClient from "./client";
import { Project, Sprint, HappinessRating, StandupEmail, ProjectDto } from "@/types/models";
import { ApiResponse } from "@/types/api";

/**
 * Project API methods
 */
const projectsApi = {
  getProjects: async (): Promise<Project[]> => {
    try {
      const response = await ApiClient.getInstance().get<
        ApiResponse<Project[]>
      >("/courseProject");

      if (!response || !response.success || !Array.isArray(response.data)) {
        console.error("Unexpected response format:", response);
        return [];
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
  },

  getUserProjects: async (userEmail: string): Promise<ProjectDto[]> => {
    try {
      const response = await ApiClient.getInstance().get<ProjectDto[]>(
        "/user/projects",
        { userEmail }
      );

      if (!Array.isArray(response)) {
        console.error("Unexpected response format:", response);
        return [];
      }

      return response;
    } catch (error) {
      console.error("Error fetching user projects:", error);
      return [];
    }
  },

  getProjectsByCourseName: async (courseName: string): Promise<Project[]> => {
    try {
      const response = await ApiClient.getInstance().get<Project[]>(
        "/courseProject",
        { courseName }
      );

      if (!Array.isArray(response)) {
        console.error("Unexpected response format:", response);
        return [];
      }

      return response;
    } catch (error) {
      console.error("Error fetching projects by course name:", error);
      return [];
    }
  },

  addProject: (body: {
    projectName: string;
    courseId: number;
    studentsCanJoinProject: boolean;
  }): Promise<Response> => {
    return ApiClient.getInstance().post<Response>("/courseProject", body);
  },

  updateProject: (
    projectId: number,
    body: {
      projectName: string;
      courseId?: number;
    }
  ): Promise<Response> => {
    return ApiClient.getInstance().put<Response>(
      `/courseProject/${projectId}`,
      body
    );
  },

  deleteProject: (projectId: number): Promise<Response> => {
    return ApiClient.getInstance().delete<Response>(
      `/courseProject/${projectId}`
    );
  },

  // Sprint management
  getSprints: async (projectId: number): Promise<Sprint[]> => {
    try {
      const response = await ApiClient.getInstance().get<
        ApiResponse<Sprint[]>
      >("/courseProject/sprints", { projectId });

      if (!response || !response.success || !Array.isArray(response.data)) {
        console.error("Unexpected response format:", response);
        return [];
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching sprints:", error);
      return [];
    }
  },

  addSprint: (body: {
    projectId: number;
    sprintEndDate: string;
  }): Promise<Response> => {
    return ApiClient.getInstance().post<Response>(
      "/courseProject/sprint",
      body
    );
  },

  // Happiness tracking
  getHappiness: async (
    projectId: number,
    sprintId?: number
  ): Promise<HappinessRating[]> => {
    try {
      const params: Record<string, number> = { projectId };
      if (sprintId !== undefined) {
        params.sprintId = sprintId;
      }

      const response = await ApiClient.getInstance().get<
        ApiResponse<HappinessRating[]>
      >("/courseProject/happiness", params);

      if (!response || !response.success || !Array.isArray(response.data)) {
        console.error("Unexpected response format:", response);
        return [];
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching happiness data:", error);
      return [];
    }
  },

  saveHappiness: (body: {
    userId: number;
    projectId: number;
    sprintId: number;
    rating: number;
  }): Promise<Response> => {
    return ApiClient.getInstance().post<Response>(
      "/courseProject/happiness",
      body
    );
  },

  sendStandupEmail: (body: StandupEmail): Promise<Response> => {
    return ApiClient.getInstance().post<Response>(
      "/courseProject/standupsEmail",
      body
    );
  },

  // Project configuration
  getProjectConfig: async (
    projectId: number
  ): Promise<{ id: number; projectUrl: string; githubUrl: string } | null> => {
    try {
      const response = await ApiClient.getInstance().get<
        ApiResponse<{ id: number; projectUrl: string; githubUrl: string }>
      >(`/projConfig/${projectId}`);

      if (!response || !response.success) {
        return null;
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching project config:", error);
      return null;
    }
  },

  updateProjectConfig: (
    projectId: number,
    body: {
      projectUrl: string;
      githubUrl: string;
    }
  ): Promise<Response> => {
    return ApiClient.getInstance().put<Response>(
      `/projConfig/${projectId}`,
      body
    );
  },
};

export default projectsApi;
