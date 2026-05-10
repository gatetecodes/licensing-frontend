import { apiClient } from "@/lib/axios";
import { AxiosApiError } from "@/lib/api-error";
import type { IApiSuccessResponse } from "@/types/api.types";
import type { AuditLogListPayload } from "../types/audit.types";

const getData = <T>(response: { data: IApiSuccessResponse<T> }): T => {
  if (!response.data.data) {
    throw new AxiosApiError("API response data is missing", {
      status: response.data.status,
      details: response.data,
    });
  }
  return response.data.data;
};

export const auditService = {
  getByApplicationId: async (applicationId: string): Promise<AuditLogListPayload> =>
    getData(
      await apiClient.get<IApiSuccessResponse<AuditLogListPayload>>(
        `/applications/${applicationId}/audit-log`,
      ),
    ),
};
