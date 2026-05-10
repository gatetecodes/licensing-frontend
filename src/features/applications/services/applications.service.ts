import { apiClient } from "@/lib/axios";
import type { IApiSuccessResponse } from "@/types/api.types";
import { AxiosApiError } from "@/lib/api-error";
import type {
  ApplicationDetailPayload,
  ApplicationListPayload,
  CreateApplicationPayload,
  UpdateDraftPayload,
  WorkflowActionPayload,
  WorkflowResubmitPayload,
} from "../types/applications.types";

const cleanData = (
  obj: CreateApplicationPayload | UpdateDraftPayload,
): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      value === "" ? null : value,
    ]),
  );
};

const getData = <T>(response: { data: IApiSuccessResponse<T> }): T => {
  if (!response.data.data) {
    throw new AxiosApiError("API response data is missing", {
      status: response.data.status,
      details: response.data,
    });
  }
  return response.data.data;
};

export const applicationsService = {
  list: async (current_state?: string): Promise<ApplicationListPayload> => {
    const response = await apiClient.get<
      IApiSuccessResponse<ApplicationListPayload>
    >("/applications", {
      params: current_state ? { current_state } : undefined,
    });
    return getData(response);
  },


  getById: async (id: string): Promise<ApplicationDetailPayload> => {
    const response = await apiClient.get<
      IApiSuccessResponse<ApplicationDetailPayload>
    >(`/applications/${id}`);
    return getData(response);
  },


  createDraft: async (
    payload: CreateApplicationPayload,
  ): Promise<ApplicationDetailPayload> => {
    const cleanedPayload = cleanData(payload);

    const response = await apiClient.post<
      IApiSuccessResponse<ApplicationDetailPayload>
    >("/applications", cleanedPayload);
    return getData(response);
  },


  updateDraft: async (
    payload: UpdateDraftPayload,
  ): Promise<ApplicationDetailPayload> => {
    const { id, lock_version, ...data } = payload;
    const cleanedData = cleanData(data);

    const response = await apiClient.patch<
      IApiSuccessResponse<ApplicationDetailPayload>
    >(`/applications/${id}/draft`, {
      ...cleanedData,
      lock_version,
    });
    return getData(response);
  },


  submit: async ({
    id,
    lock_version,
  }: WorkflowActionPayload): Promise<ApplicationDetailPayload> => {
    const response = await apiClient.post<
      IApiSuccessResponse<ApplicationDetailPayload>
    >(`/applications/${id}/submit`, { lock_version });
    return getData(response);
  },

  
  resubmit: async ({
    id,
    lock_version,
    responses,
  }: WorkflowResubmitPayload): Promise<ApplicationDetailPayload> => {
    const response = await apiClient.post<
      IApiSuccessResponse<ApplicationDetailPayload>
    >(`/applications/${id}/resubmit`, { lock_version, responses });
    return getData(response);
  },
};
