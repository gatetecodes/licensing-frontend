import axios, { AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import type { QueryClient } from "@tanstack/react-query";

import { env } from "../config/env";
import { authQueryKeys } from "../features/auth/hooks/use-auth";
import type { CsrfTokenPayload } from "../features/auth/types/auth.types";
import type { IApiSuccessResponse } from "../types/api.types";
import { AxiosApiError, normalizeAxiosApiError } from "./api-error";

const CSRF_HEADER = "x-csrf-token";
const MUTATION_METHODS = new Set(["post", "put", "patch", "delete"]);

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retriedForCsrf?: boolean;
};

let csrfToken: string | null = null;
let csrfTokenInFlight: Promise<string> | null = null;
let queryClientRef: QueryClient | null = null;
let onUnauthorizedHandler: (() => void) | null = null;

const baseConfig = {
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  timeout: env.apiTimeoutMs,
};

const csrfClient = axios.create(baseConfig);

export const apiClient = axios.create(baseConfig);

const isMutatingMethod = (method?: string): boolean =>
  MUTATION_METHODS.has((method ?? "").toLowerCase());

const isCsrfEndpoint = (url?: string): boolean =>
  (url ?? "").includes("/auth/csrf-token");

const isAuthMeGetRequest = (config?: InternalAxiosRequestConfig): boolean => {
  if (!config) {
    return false;
  }
  const method = (config.method ?? "get").toLowerCase();
  if (method !== "get") {
    return false;
  }
  const url = config.url ?? "";
  return url === "/auth/me" || url.endsWith("/auth/me");
};

const getCsrfTokenFromResponse = (
  response: AxiosResponse<IApiSuccessResponse<CsrfTokenPayload>>,
): string | null => response.data.data?.csrfToken ?? null;

const isCsrfFailure = (error: AxiosApiError): boolean =>
  error.status === 403 && error.message.toLowerCase().includes("csrf token");

const setHeader = (
  config: InternalAxiosRequestConfig,
  headerName: string,
  value: string,
) => {
  if (config.headers instanceof AxiosHeaders) {
    config.headers.set(headerName, value);
    return;
  }

  const headers = AxiosHeaders.from(config.headers);
  headers.set(headerName, value);
  config.headers = headers;
};

const fetchCsrfToken = async (forceRefresh = false): Promise<string> => {
  if (csrfToken && !forceRefresh) {
    return csrfToken;
  }

  if (csrfTokenInFlight) {
    return csrfTokenInFlight;
  }

  csrfTokenInFlight = csrfClient
    .get<IApiSuccessResponse<CsrfTokenPayload>>("/auth/csrf-token")
    .then((response) => {
      const nextToken = getCsrfTokenFromResponse(response);

      if (!nextToken) {
        throw new AxiosApiError("Unable to obtain CSRF token from API response", {
            status: response.data.status,
            details: response.data,
          },
        );
      }

      csrfToken = nextToken;
      return nextToken;
    })
    .finally(() => {
      csrfTokenInFlight = null;
    });

  return csrfTokenInFlight;
};

export const resetCsrfToken = () => {
  csrfToken = null;
  csrfTokenInFlight = null;
};

export const configureAxiosApiClient = (args: {
  queryClient: QueryClient;
  onUnauthorized: () => void;
}) => {
  queryClientRef = args.queryClient;
  onUnauthorizedHandler = args.onUnauthorized;
};

apiClient.interceptors.request.use(async (config) => {
  if (isMutatingMethod(config.method) && !isCsrfEndpoint(config.url)) {
    const token = await fetchCsrfToken();
    setHeader(config, CSRF_HEADER, token);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const normalizedError = normalizeAxiosApiError(error);
    const requestConfig = error?.config as RetriableRequestConfig | undefined;

    if (
      requestConfig &&
      isMutatingMethod(requestConfig.method) &&
      !requestConfig._retriedForCsrf &&
      isCsrfFailure(normalizedError)
    ) {
      try {
        requestConfig._retriedForCsrf = true;
        const refreshedToken = await fetchCsrfToken(true);
        setHeader(requestConfig, CSRF_HEADER, refreshedToken);
        return apiClient.request(requestConfig);
      } catch (refreshError) {
        return Promise.reject(normalizeAxiosApiError(refreshError));
      }
    }

    if (normalizedError.status === 401) {
      resetCsrfToken();
      queryClientRef?.setQueryData(authQueryKeys.me, null);
      if (!isAuthMeGetRequest(requestConfig)) {
        onUnauthorizedHandler?.();
      }
    }

    return Promise.reject(normalizedError);
  },
);
