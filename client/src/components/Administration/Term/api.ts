import { Term } from "./types";
import { Course } from "../Course/types";
import ApiClient from "@/services/api/client";
import { TermName } from "@/valueTypes/TermName";

const termApi = {
  getTerms: async (): Promise<Term[]> => {
    try {
      const response = await ApiClient.getInstance().get<{
        success: boolean;
        data: Term[];
      }>("/term");

      if (!response || !response.success || !Array.isArray(response.data)) {
        console.error("Unexpected response format: ", response);
        return [];
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching terms: ", error);
      return [];
    }
  },

  getTermCourses: async (termId: number): Promise<Course[]> => {
    try {
      const response = await ApiClient.getInstance().get<{
        success: boolean;
        data: Course[];
      }>(
        "/term/courses",
        { termId }
      );

      if (!response || !response.success || !Array.isArray(response.data)) {
        console.error("Unexpected response format: ", response);
        return [];
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching term courses: ", error);
      return [];
    }
  },

  createTerm: (body: {
    termName: TermName;
    displayName: string;
  }): Promise<Response> => {
    return ApiClient.getInstance().post<Response>("/term", body, true);
  },

  deleteTerm: (id: number): Promise<Response> => {
    return ApiClient.getInstance().delete<Response>(`/term/${id}`, true);
  },

  addCourse: (body: {
    courseName: string;
    termId: number;
  }): Promise<Response> => {
    return ApiClient.getInstance().post<Response>("/termCourse", body, true);
  },
};

export default termApi;
