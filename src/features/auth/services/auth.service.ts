import type { AxiosResponse } from "axios";

import { AxiosApiError } from "../../../lib/api-error";
import { apiClient } from "../../../lib/axios";
import type { IApiSuccessResponse } from "../../../types/api.types";
import type {
  AuthSessionPayload,
  CsrfTokenPayload,
  LoginPayload,
  PasswordSetupRequestPayload,
  RegisterPayload,
  SetPasswordPayload,
  VerifyEmailPayload,
} from "../types/auth.types";

const getResponseData = <T>(
  response: AxiosResponse<IApiSuccessResponse<T>>,
): T => {
  if (response.data.data === undefined) {
    throw new AxiosApiError("API response data is missing", {
      status: response.data.status,
      details: response.data,
    });
  }

  return response.data.data;
};

export const authService = {
  getCsrfToken: async (): Promise<CsrfTokenPayload> => {
    const response =
      await apiClient.get<IApiSuccessResponse<CsrfTokenPayload>>(
        "/auth/csrf-token",
      );
    return getResponseData(response);
  },

  login: async (payload: LoginPayload): Promise<AuthSessionPayload> => {
    const response = await apiClient.post<
      IApiSuccessResponse<AuthSessionPayload>
    >("/auth/login", payload);
    return getResponseData(response);
  },

  register: async (payload: RegisterPayload): Promise<void> => {
    await apiClient.post<IApiSuccessResponse<undefined>>("/auth/register", payload);
  },

  me: async (): Promise<AuthSessionPayload> => {
    const response =
      await apiClient.get<IApiSuccessResponse<AuthSessionPayload>>("/auth/me");
    return getResponseData(response);
  },

  logout: async (): Promise<void> => {
    await apiClient.post<IApiSuccessResponse<undefined>>("/auth/logout");
  },

  verifyEmail: async (
    payload: VerifyEmailPayload,
  ): Promise<AuthSessionPayload> => {
    const response = await apiClient.post<
      IApiSuccessResponse<AuthSessionPayload>
    >("/auth/verify-email", payload);
    return getResponseData(response);
  },

  setPassword: async (payload: SetPasswordPayload): Promise<void> => {
    await apiClient.post<IApiSuccessResponse<undefined>>(
      `/auth/set-password?token=${encodeURIComponent(payload.token)}`,
      {
        newPassword: payload.newPassword,
        confirmPassword: payload.confirmPassword,
      },
    );
  },

  requestPasswordSetup: async (
    payload: PasswordSetupRequestPayload,
  ): Promise<void> => {
    await apiClient.post<IApiSuccessResponse<undefined>>(
      "/auth/password-setup/request",
      payload,
    );
  },
};
