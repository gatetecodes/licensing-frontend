import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { feedback } from "../../lib/feedback/feedback-bridge";
import { isAxiosApiError } from "../../lib/api-error";

const getErrorMessage = (error: unknown): string => {
  if (isAxiosApiError(error)) {
    if (error.requestId) {
      return `${error.message} (Request ID: ${error.requestId})`;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
};

const shouldShowGlobalError = (error: unknown): boolean =>
  !(isAxiosApiError(error) && error.status === 401);

const hasSuppressedGlobalErrorToast = (meta: Record<string, unknown> | undefined): boolean =>
  meta?.suppressGlobalErrorToast === true;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (
        shouldShowGlobalError(error) &&
        !hasSuppressedGlobalErrorToast(query.meta as Record<string, unknown> | undefined)
      ) {
        feedback.error(getErrorMessage(error));
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (
        shouldShowGlobalError(error) &&
        !hasSuppressedGlobalErrorToast(mutation.meta as Record<string, unknown> | undefined)
      ) {
        feedback.error(getErrorMessage(error));
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (isAxiosApiError(error) && error.status === 401) {
          return false;
        }

        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
    mutations: {
      retry: false,
    },
  },
});
