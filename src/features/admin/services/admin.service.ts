import { apiClient } from "@/lib/axios";
import { AxiosApiError } from "@/lib/api-error";
import type { IApiSuccessResponse } from "@/types/api.types";
import type {
  AdminUserListPayload,
  AdminUserPayload,
  InviteInternalUserPayload,
  ManagedUserStatus,
} from "../types/admin.types";

const getData = <T>(response: { data: IApiSuccessResponse<T> }): T => {
  if (!response.data.data) {
    throw new AxiosApiError("API response data is missing", {
      status: response.data.status,
      details: response.data,
    });
  }
  return response.data.data;
};

export const adminService = {
  listUsers: async (filters?: {
    status?: ManagedUserStatus;
    role?: string;
  }): Promise<AdminUserListPayload> =>
    getData(
      await apiClient.get<IApiSuccessResponse<AdminUserListPayload>>("/admin/users", {
        params: filters,
      }),
    ),
  updateStatus: async (payload: {
    id: string;
    status: ManagedUserStatus;
  }): Promise<AdminUserPayload> =>
    getData(
      await apiClient.patch<IApiSuccessResponse<AdminUserPayload>>(
        `/admin/users/${payload.id}/status`,
        { status: payload.status },
      ),
    ),
  inviteInternalUser: async (payload: InviteInternalUserPayload): Promise<void> => {
    await apiClient.post<IApiSuccessResponse<undefined>>(
      "/auth/invite-internal-user",
      payload,
    );
  },
};
