import { useCallback, useState } from "react";

import type { Application } from "@/features/applications/types/applications.types";
import { useAuthSession } from "@/features/auth/hooks/use-auth";
import { isApprover, isReviewer } from "@/features/auth/utils/role.utils";
import { documentsService } from "@/features/documents/services/documents.service";
import { getAxiosApiErrorMessage } from "@/lib/api-error";
import { feedback } from "@/lib/feedback/feedback-bridge";

import {
  createRequestDraftRow,
  type RequestDraftRow,
} from "./review-queue.constants";
import { useReviewQueuePageData } from "./use-review-queue-page-data";

export type ReviewQueueActiveAction =
  | "REQUEST_INFO"
  | "MARK_READY"
  | "DECIDE"
  | null;

export const useReviewQueuePageController = () => {
  const { user } = useAuthSession();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<{
    blob: Blob;
    title: string;
  } | null>(null);
  const [actionApplication, setActionApplication] =
    useState<Application | null>(null);
  const [activeAction, setActiveAction] =
    useState<ReviewQueueActiveAction>(null);
  const [requestRows, setRequestRows] = useState<RequestDraftRow[]>([
    createRequestDraftRow(),
  ]);
  const [reviewerSummaryNote, setReviewerSummaryNote] = useState("");
  const [readyNote, setReadyNote] = useState("");
  const [decisionReason, setDecisionReason] = useState("");

  const {
    listQuery,
    detailQuery,
    selectedApplication,
    uploadedDocsMap,
    startReview,
    requestInformation,
    markReady,
    approve,
    reject,
    isBusy,
  } = useReviewQueuePageData({
    userId: user?.id,
    userRoleName: user?.role?.name,
    enabled: Boolean(user),
    selectedId,
  });

  const resetActionState = useCallback(() => {
    setActionApplication(null);
    setActiveAction(null);
    setRequestRows([createRequestDraftRow()]);
    setReviewerSummaryNote("");
    setReadyNote("");
    setDecisionReason("");
  }, []);

  const mutateWithFeedback = useCallback(
    async (run: () => Promise<unknown>, successMessage: string) => {
      try {
        await run();
        feedback.success(successMessage);
        resetActionState();
        await listQuery.refetch();
        if (selectedId) {
          await detailQuery.refetch();
        }
      } catch (error) {
        feedback.error(getAxiosApiErrorMessage(error));
      }
    },
    [detailQuery, listQuery, resetActionState, selectedId],
  );

  const handleViewDocument = useCallback(
    async (versionId: string, type: string) => {
      try {
        const { blob } = await documentsService.downloadVersion(versionId);
        setViewingFile({
          blob,
          title: type.replaceAll("_", " "),
        });
      } catch (error) {
        feedback.error(
          getAxiosApiErrorMessage(error, "Failed to load document."),
        );
      }
    },
    [],
  );

  const canReview = isReviewer(user);
  const canDecide = isApprover(user);
  const canCurrentUserDecide = useCallback(
    (application: Application) =>
      canDecide && application.reviewed_by_id !== user?.id,
    [canDecide, user?.id],
  );

  const validateRequestRows = useCallback(() => {
    if (requestRows.length === 0) {
      feedback.error("Add at least one request item.");
      return false;
    }

    for (const row of requestRows) {
      if (!row.instruction.trim()) {
        feedback.error("Each request item must include an instruction.");
        return false;
      }

      if (row.type === "FIELD_UPDATE" && !row.field_key) {
        feedback.error("Field update requests must specify a field.");
        return false;
      }

      if (row.type === "DOCUMENT_REPLACEMENT" && !row.document_type) {
        feedback.error(
          "Document replacement requests must specify a document type.",
        );
        return false;
      }
    }

    return true;
  }, [requestRows]);

  const handleStartReview = useCallback(
    (application: Application) => {
       mutateWithFeedback(
        () =>
          startReview.mutateAsync({
            id: application.id,
            lock_version: application.lock_version,
          }),
        "Review started.",
      );
    },
    [mutateWithFeedback, startReview],
  );

  const submitRequestInformation = useCallback(() => {
    if (!validateRequestRows() || !actionApplication) {
      return;
    }
     mutateWithFeedback(
      () =>
        requestInformation.mutateAsync({
          id: actionApplication.id,
          lock_version: actionApplication.lock_version,
          reviewer_summary_note: reviewerSummaryNote.trim() || undefined,
          request_items: requestRows.map((row) => ({
            type: row.type,
            instruction: row.instruction.trim(),
            field_key: row.field_key,
            document_type:
              row.type === "ADDITIONAL_DOCUMENT"
                ? "SUPPORTING_DOCUMENT"
                : row.document_type,
            required: row.required,
          })),
        }),
      "Information request sent successfully.",
    );
  }, [
    actionApplication,
    mutateWithFeedback,
    requestInformation,
    requestRows,
    reviewerSummaryNote,
    validateRequestRows,
  ]);

  const submitMarkReady = useCallback(() => {
    if (!actionApplication) {
      return;
    }
    if (!readyNote.trim()) {
      feedback.error("Please add a completion note before marking ready.");
      return;
    }
     mutateWithFeedback(
      () =>
        markReady.mutateAsync({
          id: actionApplication.id,
          lock_version: actionApplication.lock_version,
          notes: readyNote,
        }),
      "Application marked ready for decision.",
    );
  }, [actionApplication, markReady, mutateWithFeedback, readyNote]);

  const submitReject = useCallback(() => {
    if (!actionApplication) {
      return;
    }
    if (!decisionReason.trim()) {
      feedback.error("Please provide a reason for rejection.");
      return;
    }
     mutateWithFeedback(
      () =>
        reject.mutateAsync({
          id: actionApplication.id,
          lock_version: actionApplication.lock_version,
          decision_reason: decisionReason,
        }),
      "Application rejected.",
    );
  }, [actionApplication, decisionReason, mutateWithFeedback, reject]);

  const submitApprove = useCallback(() => {
    if (!actionApplication) {
      return;
    }
    if (!decisionReason.trim()) {
      feedback.error("Please provide a reason for approval.");
      return;
    }
     mutateWithFeedback(
      () =>
        approve.mutateAsync({
          id: actionApplication.id,
          lock_version: actionApplication.lock_version,
          decision_reason: decisionReason,
        }),
      "Application approved successfully.",
    );
  }, [actionApplication, approve, decisionReason, mutateWithFeedback]);

  const openRequestInformation = useCallback((application: Application) => {
    setActionApplication(application);
    setActiveAction("REQUEST_INFO");
  }, []);

  const openMarkReady = useCallback((application: Application) => {
    setActionApplication(application);
    setActiveAction("MARK_READY");
  }, []);

  const openDecide = useCallback((application: Application) => {
    setActionApplication(application);
    setActiveAction("DECIDE");
  }, []);

  return {
    user,
    listQuery,
    selectedId,
    setSelectedId,
    viewingFile,
    setViewingFile,
    actionApplication,
    activeAction,
    requestRows,
    setRequestRows,
    reviewerSummaryNote,
    setReviewerSummaryNote,
    readyNote,
    setReadyNote,
    decisionReason,
    setDecisionReason,
    resetActionState,
    selectedApplication,
    uploadedDocsMap,
    isBusy,
    canReview,
    canDecide,
    canCurrentUserDecide,
    handleViewDocument,
    handleStartReview,
    submitRequestInformation,
    submitMarkReady,
    submitApprove,
    submitReject,
    openRequestInformation,
    openMarkReady,
    openDecide,
  };
};
