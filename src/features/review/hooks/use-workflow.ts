import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applicationsQueryKeys } from "@/features/applications/hooks/use-applications";
import { workflowService } from "../services/workflow.service";

export const useStartReviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workflowService.startReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};

export const useRequestInformationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workflowService.requestInformation,
    onSuccess: ({ application }) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.setQueryData(applicationsQueryKeys.detail(application.id), { application });
    },
  });
};

export const useMarkReadyForDecisionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workflowService.markReadyForDecision,
    onSuccess: ({ application }) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.setQueryData(applicationsQueryKeys.detail(application.id), { application });
    },
  });
};

export const useApproveMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workflowService.approve,
    onSuccess: ({ application }) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.setQueryData(applicationsQueryKeys.detail(application.id), { application });
    },
  });
};

export const useRejectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workflowService.reject,
    onSuccess: ({ application }) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.setQueryData(applicationsQueryKeys.detail(application.id), { application });
    },
  });
};
