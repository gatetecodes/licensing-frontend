import {
  queryOptions,
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { resetCsrfToken } from "../../../lib/axios";
import { isAxiosApiError } from "../../../lib/api-error";
import { authService } from "../services/auth.service";
import type {
  AuthSessionPayload,
  LoginPayload,
  PasswordSetupRequestPayload,
  RegisterPayload,
  SessionState,
  SetPasswordPayload,
  VerifyEmailPayload,
} from "../types/auth.types";

export const authQueryKeys = {
  me: ["auth", "me"] as const,
};

export const authMeQueryOptions = () =>
  queryOptions({
    queryKey: authQueryKeys.me,
    queryFn: authService.me,
    staleTime: 60 * 1000,
    retry: (failureCount, error) => {
      if (isAxiosApiError(error) && error.status === 401) {
        return false;
      }

      return failureCount < 1;
    },
  });

export const buildSessionState = (
  sessionData: AuthSessionPayload | null | undefined,
  isLoading = false,
): SessionState => ({
  user: sessionData?.user ?? null,
  isAuthenticated: sessionData?.user ? true : false,
  isLoading,
});

export const getSessionStateFromCache = (
  queryClient: QueryClient,
): SessionState => {
  const sessionData = queryClient.getQueryData<AuthSessionPayload | null>(
    authQueryKeys.me,
  );

  return buildSessionState(sessionData ?? null, false);
};

export const useAuthSession = (): SessionState & {
  csrfToken?: string;
  refetch: () => Promise<unknown>;
} => {
  const query = useQuery(authMeQueryOptions());

  return {
    ...buildSessionState(query.data ?? null, query.isLoading),
    csrfToken: query.data?.csrfToken,
    refetch: query.refetch,
  };
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<AuthSessionPayload, Error, LoginPayload, unknown>({
    mutationFn: authService.login,
    onSuccess: (session) => {
      queryClient.setQueryData(authQueryKeys.me, session);
    },
    meta: {
      suppressGlobalErrorToast: true,
    },
  });
};

export const useLoginMutationWithOptions = (
  options?: UseMutationOptions<AuthSessionPayload, Error, LoginPayload, unknown>,
) => {
  const queryClient = useQueryClient();

  return useMutation<AuthSessionPayload, Error, LoginPayload, unknown>({
    mutationFn: authService.login,
    onSuccess: (session, variables, onMutateResult, context) => {
      queryClient.setQueryData(authQueryKeys.me, session);
      options?.onSuccess?.(session, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      options?.onError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      options?.onSettled?.(data, error, variables, onMutateResult, context);
    },
    meta: {
      suppressGlobalErrorToast: true,
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      resetCsrfToken();
      queryClient.setQueryData(authQueryKeys.me, null);
      queryClient.removeQueries({ queryKey: authQueryKeys.me });
    },
  });
};

export const useVerifyEmailMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VerifyEmailPayload) =>
      authService.verifyEmail(payload),
    onSuccess: (session) => {
      queryClient.setQueryData(authQueryKeys.me, session);
    },
  });
};

export const useSetPasswordMutation = () =>
  useMutation({
    mutationFn: (payload: SetPasswordPayload) =>
      authService.setPassword(payload),
  });

export const useRegisterMutation = () =>
  useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
  });

export const usePasswordSetupRequestMutation = () =>
  useMutation({
    mutationFn: (payload: PasswordSetupRequestPayload) =>
      authService.requestPasswordSetup(payload),
  });
