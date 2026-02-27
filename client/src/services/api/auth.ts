import ApiClient from "./client";
import { LoginResponse, RegisterResponse } from "@/types/api";

/**
 * Authentication API methods
 */
const authApi = {
  login: async (email: string, password: string, rememberMe: boolean = false): Promise<LoginResponse> => {
    return ApiClient.getInstance().post<LoginResponse>("/session", {
      email,
      password,
      rememberMe,
    });
  },

  register: async (
    email: string,
    password: string,
    name: string
  ): Promise<RegisterResponse> => {
    return ApiClient.getInstance().post<RegisterResponse>("/user", {
      email,
      password,
      name,
    });
  },

  forgotPassword: async (email: string): Promise<{ success: boolean }> => {
    return ApiClient.getInstance().post<{ success: boolean }>(
      "/user/password/forgotMail",
      { email }
    );
  },

  resetPassword: async (
    token: string,
    newPassword: string
  ): Promise<{ success: boolean }> => {
    return ApiClient.getInstance().post<{ success: boolean }>(
      "/user/password/reset",
      { token, newPassword }
    );
  },

  confirmEmail: async (token: string): Promise<{ success: boolean }> => {
    return ApiClient.getInstance().post<{ success: boolean }>(
      "/user/confirmation/email",
      { token }
    );
  },
};

export default authApi;
