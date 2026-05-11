import { useMemo } from "react";

import {
  useApplicationDetail,
  useApplicationsList,
} from "@/features/applications/hooks/use-applications";
import { useApplicationDocuments } from "@/features/documents/hooks/use-documents";
import {
  useApproveMutation,
  useMarkReadyForDecisionMutation,
  useRejectMutation,
  useRequestInformationMutation,
  useStartReviewMutation,
} from "./use-workflow";

type UseReviewQueuePageDataParams = {
  userId?: string;
  userRoleName?: string;
  enabled: boolean;
  selectedId: string | null;
};

export const useReviewQueuePageData = ({
  userId,
  userRoleName,
  enabled,
  selectedId,
}: UseReviewQueuePageDataParams) => {
  const listQuery = useApplicationsList({
    viewerId: userId,
    viewerRole: userRoleName,
    enabled,
  });

  const detailQuery = useApplicationDetail(selectedId ?? undefined);
  const docsQuery = useApplicationDocuments(selectedId ?? undefined);

  const startReview = useStartReviewMutation();
  const requestInformation = useRequestInformationMutation();
  const markReady = useMarkReadyForDecisionMutation();
  const approve = useApproveMutation();
  const reject = useRejectMutation();

  const isBusy =
    startReview.isPending ||
    requestInformation.isPending ||
    markReady.isPending ||
    approve.isPending ||
    reject.isPending;

  const selectedApplication = detailQuery.data?.application;

  const uploadedDocsMap = useMemo(() => {
    const uploaded = new Map<string, string>();
    (docsQuery.data?.items ?? []).forEach((item) => {
      if (item.latest_version) {
        uploaded.set(item.document_type, item.latest_version.id);
      }
    });
    return uploaded;
  }, [docsQuery.data?.items]);

  return {
    listQuery,
    detailQuery,
    docsQuery,
    selectedApplication,
    uploadedDocsMap,
    startReview,
    requestInformation,
    markReady,
    approve,
    reject,
    isBusy,
  };
};
