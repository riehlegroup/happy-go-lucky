import ApiClient from "./client";

const adminApi = {
  getShutdownStatus: (): Promise<{ isShuttingDown: boolean }> => {
    return ApiClient.getInstance().get<{ isShuttingDown: boolean }>(
      "/admin/shutdown/status",
      undefined,
      true
    );
  },

  shutdown: (): Promise<{ success: boolean; message: string }> => {
    return ApiClient.getInstance().post<{ success: boolean; message: string }>(
      "/admin/shutdown",
      {},
      true
    );
  },

  start: (): Promise<{ success: boolean; message: string }> => {
    return ApiClient.getInstance().post<{ success: boolean; message: string }>(
      "/admin/start",
      {},
      true
    );
  },
};

export default adminApi;
