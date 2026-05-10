import { apiClient } from "@/lib/axios";
import type { IApiSuccessResponse } from "@/types/api.types";
import { AxiosApiError } from "@/lib/api-error";
import type { ApplicationDetailPayload } from "@/features/applications/types/applications.types";
import type {
  WorkflowFieldKey,
  WorkflowRequestItemType,
} from "@/features/applications/types/applications.types";

interface WorkflowBasePayload {
  id: string;
  lock_version: number;
}

interface WorkflowNotesPayload extends WorkflowBasePayload {
  notes: string;
}

interface WorkflowRequestItemInput {
  type: WorkflowRequestItemType;
  instruction: string;
  field_key?: WorkflowFieldKey;
  document_type?: string;
  required?: boolean;
}

interface WorkflowInformationRequestPayload extends WorkflowBasePayload {
  reviewer_summary_note?: string;
  request_items: WorkflowRequestItemInput[];
}

interface WorkflowDecisionPayload extends WorkflowBasePayload {
  decision_reason: string;
}

const getData = <T>(response: { data: IApiSuccessResponse<T> }): T => {
  if (!response.data.data) {
    throw new AxiosApiError("API response data is missing", {
      status: response.data.status,
      details: response.data,
    });
  }
  return response.data.data;
};

export const workflowService = {
  startReview: async ({ id, lock_version }: WorkflowBasePayload) =>
    getData(
      await apiClient.post<IApiSuccessResponse<ApplicationDetailPayload>>(
        `/applications/${id}/start-review`,
        { lock_version },
      ),
    ),
  requestInformation: async ({
    id,
    lock_version,
    request_items,
    reviewer_summary_note,
  }: WorkflowInformationRequestPayload) =>
    getData(
      await apiClient.post<IApiSuccessResponse<ApplicationDetailPayload>>(
        `/applications/${id}/request-information`,
        { lock_version, request_items, reviewer_summary_note },
      ),
    ),
  markReadyForDecision: async ({ id, lock_version, notes }: WorkflowNotesPayload) =>
    getData(
      await apiClient.post<IApiSuccessResponse<ApplicationDetailPayload>>(
        `/applications/${id}/mark-ready-for-decision`,
        { lock_version, notes },
      ),
    ),
  approve: async ({ id, lock_version, decision_reason }: WorkflowDecisionPayload) =>
    getData(
      await apiClient.post<IApiSuccessResponse<ApplicationDetailPayload>>(
        `/applications/${id}/approve`,
        { lock_version, decision_reason },
      ),
    ),
  reject: async ({ id, lock_version, decision_reason }: WorkflowDecisionPayload) =>
    getData(
      await apiClient.post<IApiSuccessResponse<ApplicationDetailPayload>>(
        `/applications/${id}/reject`,
        { lock_version, decision_reason },
      ),
    ),
};

export type {
  WorkflowBasePayload,
  WorkflowDecisionPayload,
  WorkflowNotesPayload,
  WorkflowInformationRequestPayload,
};
