import ApiClient from "./client";

/**
 * Administrative API methods.
 *
 * Provides access to system power controls (e.g., shutdown).
 */

type PowerStatus = {
  status: "shutdown" | "startup";
  isShuttingDown: boolean;
  shutdownAt: number | null;
  gracePeriodSeconds: number;
};

const adminApi = {
  getPowerStatus: (): Promise<PowerStatus> => {
    return ApiClient.getInstance().get<PowerStatus>("/admin/power", undefined, true);
  },

  setPowerStatus: (
    status: "shutdown"
  ): Promise<{ success: boolean; message: string }> => {
    return ApiClient.getInstance().post<{ success: boolean; message: string }>(
      "/admin/power",
      { status },
      true
    );
  },
};

export default adminApi;
