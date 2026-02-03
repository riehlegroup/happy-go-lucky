import ApiClient from "./client";
import { User } from "@/types/models";
import { ApiResponse } from "@/types/api";

/**
 * User API methods
 */
const usersApi = {
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await ApiClient.getInstance().get<ApiResponse<User[]>>(
        "/user"
      );

      if (!response || !response.success || !Array.isArray(response.data)) {
        console.error("Unexpected response format:", response);
        return [];
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  getUserRole: async (userEmail: string): Promise<string> => {
    try {
      const response = await ApiClient.getInstance().get<{
        userRole: string;
      }>("/user/role", { userEmail });

      return response.userRole;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return "";
    }
  },

  updateUser: (
    userId: number,
    body: {
      name?: string;
      email?: string;
      userRole?: string;
      userStatus?: string;
    }
  ): Promise<Response> => {
    return ApiClient.getInstance().put<Response>(`/user/${userId}`, body);
  },

  deleteUser: (userId: number): Promise<Response> => {
    return ApiClient.getInstance().delete<Response>(`/user/${userId}`);
  },

  // User configuration
  updateUserConfig: (body: {
    email: string;
    newPassword?: string;
    githubUsername?: string;
  }): Promise<Response> => {
    return ApiClient.getInstance().put<Response>("/user/config", body);
  },

  changeEmail: (body: {
    oldEmail: string;
    newEmail: string;
  }): Promise<{ success: boolean; message: string }> => {
    return ApiClient.getInstance().post<{ success: boolean; message: string }>(
      "/user/mail",
      body
    );
  },

  changePassword: (body: {
    userEmail: string;
    password: string;
  }): Promise<{ success: boolean; message: string }> => {
    return ApiClient.getInstance().post<{ success: boolean; message: string }>(
      "/user/password/change",
      body
    );
  },

  getGitHubUsername: async (userEmail: string): Promise<string> => {
    try {
      const response = await ApiClient.getInstance().get<{
        githubUsername: string;
      }>("/user/githubUsername", { userEmail });
      return response.githubUsername || "";
    } catch (error) {
      console.error("Error fetching GitHub username:", error);
      return "";
    }
  },

  updateGitHubUsername: (body: {
    userEmail: string;
    newGitHubUsername: string;
  }): Promise<{ success: boolean; message: string }> => {
    return ApiClient.getInstance().post<{ success: boolean; message: string }>(
      "/user/githubUsername",
      body
    );
  },

  // User status
  updateUserStatus: (body: {
    userEmail: string;
    userStatus: string;
  }): Promise<Response> => {
    return ApiClient.getInstance().put<Response>("/user/status", body);
  },

  updateUserStatusPost: (body: {
    userEmail: string;
    status: string;
  }): Promise<Response> => {
    return ApiClient.getInstance().post<Response>("/updateUserStatus", body);
  },

  updateUserRole: (body: {
    email: string;
    role: string;
  }): Promise<Response> => {
    return ApiClient.getInstance().post<Response>("/user/role", body);
  },

  getAllUsers: async (): Promise<Array<{
    id: number;
    email: string;
    name: string;
    githubUsername: string | null;
    status: string;
    password: string;
    userRole: string;
  }>> => {
    try {
      const response = await ApiClient.getInstance().get<Array<{
        id: number;
        email: string;
        name: string;
        githubUsername: string | null;
        status: string;
        password: string;
        userRole: string;
      }>>("/getUsers");
      return response;
    } catch (error) {
      console.error("Error fetching all users:", error);
      return [];
    }
  },

  sendConfirmationEmail: (body: {
    userEmail: string;
  }): Promise<Response> => {
    return ApiClient.getInstance().post<Response>("/user/confirmation/trigger", body);
  },

  // User-project associations
  addUserToProject: (body: {
    userId: number;
    projectId: number;
  }): Promise<Response> => {
    return ApiClient.getInstance().post<Response>("/user/project", body);
  },

  removeUserFromProject: (userId: number, projectId: number): Promise<Response> => {
    return ApiClient.getInstance().delete<Response>(`/user/project?userId=${userId}&projectId=${projectId}`);
  },
};

export default usersApi;
