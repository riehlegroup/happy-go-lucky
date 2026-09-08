import { Competition, CompetitionSubmission, DatasetType} from "@/types/competition.models";
import ApiClient from "./client";
import { ApiResponse } from "@/types/api";


export const COMPETITON_ENDPOINT_ADDITION = "/competition/competitions";


const competitionApi = {
  getCompetitionById: async (competitionId: number): Promise<Competition | null> => {
    try {
    const response= await ApiClient.getInstance().get<ApiResponse<Competition>>(`{COMPETITON_ENDPOINT_ADDITION}/${competitionId}`, undefined, true);
    if (!response || !response.success) {
      console.log("Failed to fetch competition details By Id");
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching competition details By Id:", error);
    return null;
  }
  },

  getCompetitionByCourse: async (courseId: number): Promise<Competition | null> => {
    try {
      const response = await ApiClient.getInstance().get<ApiResponse<Competition>>(`${COMPETITON_ENDPOINT_ADDITION}/course/${courseId}`,undefined, true);
      if (!response || !response.success) {
        console.log("Failed to fetch competition details By Course");
        return null;
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching competition details By Course:", error);
      return null;
    }
  },

  createCompetition: async (body: {
    name: string;
    description: string;
    courseId: number;
    startDate: string;
    endDate: string;
  }): Promise<Competition | null> => {
    try {
      const response = await ApiClient.getInstance().post<ApiResponse<Competition>>(COMPETITON_ENDPOINT_ADDITION, body, true);
      if (!response || !response.success) {
        console.log("Failed to create competition");
        return null;
      }
      return response.data;
    } catch (error) {
      console.error("Error creating competition:", error);
      return null;
    }
  },

  downloadDatasetByType: async (competitionId: number, datasetType: DatasetType) => {
    try {
     const blob = await ApiClient.getInstance().getBlob(`${COMPETITON_ENDPOINT_ADDITION}/${competitionId}/dataset`, { type: datasetType }, true);
     return blob;
    } catch (error) {
      console.error("Error fetching dataset by competition and type:", error);
      return null;
    }
  },

  uploadDataset: async (competitionId: number, datasetType: DatasetType, file: File) => {
    const formData = new FormData();
    formData.append("dataset", file);
    formData.append("type", datasetType);

    try {
      const response = await ApiClient.getInstance().post<ApiResponse<CompetitionSubmission>>(`${COMPETITON_ENDPOINT_ADDITION}/${competitionId}/dataset`, formData, true);
      if(!response || !response.success) {
        console.log("Failed to upload dataset");
        throw new Error(response?.message || "Failed to upload dataset");
      }
      return response.data;
    } catch (error) {
      console.error("Error uploading dataset:", error);
      throw new Error("Error occurred while uploading dataset");
    }
  },
  
  submitCompetitionSubmission: async (competitionId: number, submissionLink: string) => { 
    try {
      const response = await ApiClient.getInstance().post<ApiResponse<CompetitionSubmission>>(`${COMPETITON_ENDPOINT_ADDITION}/${competitionId}/submissions`, { apiUrl: submissionLink }, true);
      if(!response || !response.success) {
        console.log("Failed to submit competition submission");
        throw new Error(response?.message || "Failed to submit competition submission");
      }
      return response.data;
    } catch (error) {
      console.error("Error submitting competition submission:", error);
      throw new Error("Error occurred while submitting competition submission");
    }
  },
  
  getMySubmission: async (competitionId: number) => { 
    try {
      const response = await ApiClient.getInstance().get<ApiResponse<CompetitionSubmission>>(`${COMPETITON_ENDPOINT_ADDITION}/${competitionId}/submissions/my`, undefined, true);
      if (!response || !response.success) {
        console.log("Failed to fetch my competition submission");
       throw new Error(response?.message || "Failed to fetch my competition submission");
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching my competition submission:", error);
      throw new Error("Error occurred while fetching my competition submission");
    }
  },
};

export default competitionApi;