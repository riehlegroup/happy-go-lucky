import { API_BASE_URL } from "@/config/api";
import AuthStorage from "@/services/storage/auth";

/**
 * Centralized API client for all HTTP requests.
 * Handles authentication, error handling, and response parsing.
 */
class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = API_BASE_URL;
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private getAuthToken(): string | null {
    return AuthStorage.getInstance().getToken();
  }

  private async request<T>(
    method: string,
    endpoint: string,
    options?: {
      params?: Record<string, string | number>;
      body?: Record<string, string | number | boolean | string[]> | FormData;
      requiresAuth?: boolean;
      responseType?: "json" | "blob";
    }
  ): Promise<T> {
    const { params, body, requiresAuth = false } = options || {};

    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);

      if (params) {
        Object.entries(params).forEach(([key, value]) =>
          url.searchParams.append(key, String(value))
        );
      }

      const headers: Record<string, string> = {};

      if (!(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      if (requiresAuth) {
        const token = this.getAuthToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      let fetchBody: BodyInit | undefined;
      if(body) {
        fetchBody = body instanceof FormData ? body : JSON.stringify(body);
      }

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: fetchBody,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP Error: ${response.status}`;
        throw new Error(errorMessage);
      }

      if (options?.responseType === "blob") {
        return (await response.blob()) as unknown as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error(`API request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number>,
    requiresAuth = false
  ): Promise<T> {
    return this.request<T>("GET", endpoint, { params, requiresAuth });
  }

  async getBlob(
    endpoint: string,
    params?: Record<string, string | number>,
    requiresAuth = false
  ): Promise<Blob> {
    return this.request<Blob>("GET", endpoint, { params, requiresAuth, responseType: "blob" });
  }

  async post<T>(
    endpoint: string,
    body: Record<string, string | number | boolean | string[]> | FormData,
    requiresAuth = false,
   
  ): Promise<T> {
    return this.request<T>("POST", endpoint, { body, requiresAuth });
  }

  async put<T>(
    endpoint: string,
    body: Record<string, string | number | boolean | string[]> | FormData,
    requiresAuth = false,
  ): Promise<T> {
    return this.request<T>("PUT", endpoint, { body, requiresAuth });
  }

  async delete<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>("DELETE", endpoint, { requiresAuth });
  }
}

export default ApiClient;
