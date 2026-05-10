import axios, { type AxiosError } from "axios";

import type { IApiErrorResponse } from "../types/api.types";

export interface AxiosErrorOptions {
  status?: number;
  requestId?: string;
  code?: string;
  details?: unknown;
  isNetworkError?: boolean;
  cause?: unknown;
}

export class AxiosApiError extends Error {
  public readonly status?: number;
  public readonly requestId?: string;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly isNetworkError: boolean;

  constructor(message: string, options: AxiosErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "AxiosApiError";
    this.status = options.status;
    this.requestId = options.requestId;
    this.code = options.code;
    this.details = options.details;
    this.isNetworkError = options.isNetworkError ?? false;
  }
}

export const isAxiosApiError = (error: unknown): error is AxiosApiError =>
  error instanceof AxiosApiError;

export const normalizeAxiosApiError = (error: unknown): AxiosApiError => {
  if (isAxiosApiError(error)) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<IApiErrorResponse>;
    const responseData = axiosError.response?.data;
    const status = axiosError.response?.status;
    const requestIdHeader = axiosError.response?.headers?.["x-request-id"] as
      | string
      | undefined;

    const message =
      responseData?.message ??
      axiosError.message ??
      "Unexpected API request failure";

    return new AxiosApiError(message, {
      status,
      requestId: requestIdHeader,
      code: status?.toString(),
      details: responseData?.errors,
      isNetworkError: !status,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new AxiosApiError(error.message, { cause: error });
  }

  return new AxiosApiError("Unexpected error", {
    details: error,
  });
};

export const getAxiosApiErrorMessage = (
  error: unknown,
  fallback = "An unexpected error occurred.",
): string => {
  const normalizedError = normalizeAxiosApiError(error);
  return normalizedError.message || fallback;
};
