import { useMemo } from "react";

import { useApplicationDocuments } from "@/features/documents/hooks/use-documents";
import { useApplicationDetail, useApplicationsList, useCreateApplicationDraft, useResubmitApplication, useSubmitApplication, useUpdateApplicationDraft } from "./use-applications";
import type { Application, ApplicationState } from "../types/applications.types";
import type { DocumentType } from "@/features/documents/types/documents.types";

type UseApplicationsPageDataParams = {
  userId?: string;
  userRoleName?: string;
  canManageDrafts: boolean;
  stateFilter?: ApplicationState;
  selectedId: string | null;
  editingDraft: Application | null;
  draftInWizard: Application | null;
  requiredDocumentTypes: DocumentType[];
};

export const useApplicationsPageData = ({
  userId,
  userRoleName,
  canManageDrafts,
  stateFilter,
  selectedId,
  editingDraft,
  draftInWizard,
  requiredDocumentTypes
}: UseApplicationsPageDataParams) => {
  const listQuery = useApplicationsList({
    state: stateFilter,
    viewerId: userId,
    viewerRole: userRoleName,
    enabled: Boolean(userId)
  });

  const detailQuery = useApplicationDetail(selectedId ?? undefined);
  const responseDetailQuery = useApplicationDetail(
    editingDraft?.current_state === "INFO_REQUESTED" ? editingDraft.id : undefined
  );
  const documentsApplicationId =
    editingDraft?.id ?? draftInWizard?.id ?? selectedId ?? undefined;
  const docsQuery = useApplicationDocuments(documentsApplicationId);

  const createDraftMutation = useCreateApplicationDraft();
  const updateDraftMutation = useUpdateApplicationDraft();
  const submitMutation = useSubmitApplication();
  const resubmitMutation = useResubmitApplication();

  const selectedApplication = detailQuery.data?.application;
  const applications = useMemo(() => {
    const items = listQuery.data?.items ?? [];
    if (!canManageDrafts || !userId) {
      return items;
    }
    return items.filter((item) => item.applicant_id === userId);
  }, [canManageDrafts, listQuery.data?.items, userId]);

  const busy =
    createDraftMutation.isPending ||
    updateDraftMutation.isPending ||
    submitMutation.isPending ||
    resubmitMutation.isPending;

  const { missingRequiredDocuments, uploadedDocsMap } = useMemo(() => {
    const uploaded = new Map<string, string>();
    (docsQuery.data?.items ?? []).forEach((item) => {
      if (item.latest_version) {
        uploaded.set(item.document_type, item.latest_version.id);
      }
    });
    return {
      missingRequiredDocuments: requiredDocumentTypes.filter(
        (type) => !uploaded.has(type)
      ),
      uploadedDocsMap: uploaded
    };
  }, [docsQuery.data?.items, requiredDocumentTypes]);

  return {
    listQuery,
    detailQuery,
    responseDetailQuery,
    docsQuery,
    createDraftMutation,
    updateDraftMutation,
    submitMutation,
    resubmitMutation,
    selectedApplication,
    applications,
    busy,
    missingRequiredDocuments,
    uploadedDocsMap
  };
};
