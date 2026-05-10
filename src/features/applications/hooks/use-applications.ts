import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { applicationsService } from "../services/applications.service";
import type {
  Application,
  ApplicationState,
  CreateApplicationPayload,
  UpdateDraftPayload,
} from "../types/applications.types";

export const applicationsQueryKeys = {
  list: (args?: {
    state?: ApplicationState;
    viewerId?: string;
    viewerRole?: string;
  }) =>
    [
      "applications",
      "list",
      args?.state ?? "ALL",
      args?.viewerRole ?? "UNKNOWN_ROLE",
      args?.viewerId ?? "UNKNOWN_VIEWER",
    ] as const,
  detail: (id?: string) => ["applications", "detail", id ?? ""] as const,
};

export const useApplicationsList = (args?: {
  state?: ApplicationState;
  viewerId?: string;
  viewerRole?: string;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: applicationsQueryKeys.list({
      state: args?.state,
      viewerId: args?.viewerId,
      viewerRole: args?.viewerRole,
    }),
    queryFn: () => applicationsService.list(args?.state),
    enabled: args?.enabled ?? true,
  });

export const useApplicationDetail = (id?: string) =>
  useQuery({
    queryKey: applicationsQueryKeys.detail(id),
    queryFn: () => applicationsService.getById(id!),
    enabled: Boolean(id),
  });

export const useCreateApplicationDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateApplicationPayload) => applicationsService.createDraft(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};

export const useUpdateApplicationDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDraftPayload) => applicationsService.updateDraft(payload),
    onSuccess: (data) => {
      const updated = data.application;
      queryClient.setQueryData(applicationsQueryKeys.detail(updated.id), data);
      queryClient.invalidateQueries({ queryKey: ["applications", "list"] });
    },
  });
};

const updateListApplication = (
  applications: Application[] | undefined,
  updated?: Application,
): Application[] | undefined => {
  if (!applications || !updated) {
    return applications;
  }
  return applications.map((item) => (item.id === updated.id ? updated : item));
};

export const useSubmitApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applicationsService.submit,
    onSuccess: (data) => {
      const updated = data.application;
      queryClient.invalidateQueries({ queryKey: ["applications", "list"] });
      queryClient.setQueryData(applicationsQueryKeys.detail(updated.id), data);
      queryClient.setQueriesData(
        { queryKey: ["applications", "list"] },
        (oldData: { items: Application[]; count?: number } | undefined) =>
          oldData ? { ...oldData, items: updateListApplication(oldData.items, updated) ?? [] } : oldData,
      );
    },
  });
};

export const useResubmitApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applicationsService.resubmit,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.setQueryData(applicationsQueryKeys.detail(data.application.id), data);
    },
  });
};
