import { Competition, DatasetType} from "@/types/competition.models";
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
      const response = await ApiClient.getInstance().post(`${COMPETITON_ENDPOINT_ADDITION}/${competitionId}/dataset`, formData, true);
      return response;
    } catch (error) {
      console.error("Error uploading dataset:", error);
      return null;
    }
  }


};

export default competitionApi;