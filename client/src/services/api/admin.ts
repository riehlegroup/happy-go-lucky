import ApiClient from "./client";

const adminApi = {
  shutdown: (): Promise<{ success: boolean; message: string }> => {
    return ApiClient.getInstance().post<{ success: boolean; message: string }>(
      "/admin/shutdown",
      {},
      true
    );
  },
};

export default adminApi;
