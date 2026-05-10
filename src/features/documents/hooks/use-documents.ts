import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { documentsService } from "../services/documents.service";

export const documentQueryKeys = {
  list: (applicationId?: string) => ["documents", "list", applicationId ?? ""] as const,
  versions: (documentId?: string) => ["documents", "versions", documentId ?? ""] as const,
};

export const useApplicationDocuments = (applicationId?: string) =>
  useQuery({
    queryKey: documentQueryKeys.list(applicationId),
    queryFn: () => documentsService.listByApplication(applicationId!),
    enabled: Boolean(applicationId),
  });

export const useDocumentVersions = (documentId?: string) =>
  useQuery({
    queryKey: documentQueryKeys.versions(documentId),
    queryFn: () => documentsService.listVersions(documentId!),
    enabled: Boolean(documentId),
  });

export const useUploadDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsService.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["documents", "list"],
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};
