import { Space, Typography } from "antd";

import { FileViewModal } from "@/components/file-view-modal";
import { ReviewQueueActionModal } from "../components/review-queue-action-modal";
import { ReviewQueueDrawer } from "../components/review-queue-drawer";
import { ReviewQueueTable } from "../components/review-queue-table";
import { useReviewQueuePageController } from "../hooks/use-review-queue-page";

const { Title, Paragraph } = Typography;

const ReviewQueuePage = () => {
  const {
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
  } = useReviewQueuePageController();

  const queueItems = (listQuery.data?.items ?? []).filter(
    (item) => item.current_state !== "DRAFT",
  );

  return (
    <Space direction="vertical" size={16} className="w-full">
      <div>
        <Title level={2}>Review Queue</Title>
        <Paragraph type="secondary">
          Execute explicit workflow transitions as reviewer or approver.
        </Paragraph>
      </div>

      <ReviewQueueTable
        loading={listQuery.isLoading}
        applications={queueItems}
        canReview={canReview}
        canCurrentUserDecide={canCurrentUserDecide}
        onViewDetails={setSelectedId}
        onStartReview={handleStartReview}
        onOpenRequestInformation={openRequestInformation}
        onOpenMarkReady={openMarkReady}
        onOpenDecide={openDecide}
      />

      <ReviewQueueDrawer
        open={Boolean(selectedId)}
        selectedApplication={selectedApplication}
        userId={user?.id}
        canReview={canReview}
        canDecide={canDecide}
        canCurrentUserDecide={canCurrentUserDecide}
        isBusy={isBusy}
        uploadedDocsMap={uploadedDocsMap}
        onClose={() => setSelectedId(null)}
        onStartReview={handleStartReview}
        onOpenRequestInformation={openRequestInformation}
        onOpenMarkReady={openMarkReady}
        onOpenDecide={openDecide}
        onViewDocument={handleViewDocument}
      />

      <ReviewQueueActionModal
        open={Boolean(actionApplication)}
        actionApplication={actionApplication}
        activeAction={activeAction}
        requestRows={requestRows}
        setRequestRows={setRequestRows}
        reviewerSummaryNote={reviewerSummaryNote}
        setReviewerSummaryNote={setReviewerSummaryNote}
        readyNote={readyNote}
        setReadyNote={setReadyNote}
        decisionReason={decisionReason}
        setDecisionReason={setDecisionReason}
        isBusy={isBusy}
        onCancel={resetActionState}
        onSubmitRequestInformation={submitRequestInformation}
        onSubmitMarkReady={submitMarkReady}
        onSubmitApprove={submitApprove}
        onSubmitReject={submitReject}
      />

      <FileViewModal
        open={viewingFile !== null}
        onClose={() => setViewingFile(null)}
        fileBlob={viewingFile?.blob ?? null}
        title={viewingFile?.title}
      />
    </Space>
  );
};

export default ReviewQueuePage;
