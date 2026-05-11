import { Modal, Space, Typography } from "antd";
import { FileViewModal } from "@/components/file-view-modal";
import NewApplication from "../components/new-application";
import RespondToRequest from "../components/respond-to-request";
import ApplicationsList from "../components/applications-list-card";
import ApplicationDetailsDrawer from "../components/application-details-drawer";
import {
  applicationStates,
  requiredDocumentTypes,
  useApplicationsPageController
} from "../hooks/use-applications-page";

const { Title, Paragraph } = Typography;

const ApplicationsPage = () => {
  const {
    canManageDrafts,
    applications,
    selectedApplication,
    selectedId,
    isCreateModalOpen,
    isUpdateModalOpen,
    draftInWizard,
    editingDraft,
    viewingFile,
    stateFilter,
    createForm,
    updateForm,
    busy,
    listQuery,
    createDraftMutation,
    updateDraftMutation,
    submitMutation,
    resubmitMutation,
    uploadedDocsMap,
    missingRequiredDocuments,
    responseTargetApplication,
    setSelectedId,
    setStateFilter,
    setIsCreateModalOpen,
    setViewingFile,
    openCreateModal,
    openUpdateModal,
    closeUpdateModal,
    handleViewDocument,
    createDraft,
    submitApplication,
    handleInfoRequestDocumentsChanged,
    handleInfoRequestSaveUpdates,
    handleInfoRequestResubmit,
    handleDraftStepSave,
    handleDraftSubmit,
    handleDraftFinalSubmit,
    handleCreateWizardFinalSubmit
  } = useApplicationsPageController();

  return (
    <Space direction="vertical" size={16} className="w-full">
      <div>
        <Title level={2}>Applications</Title>
        <Paragraph type="secondary">
          Track application lifecycle from draft creation to final decision.
        </Paragraph>
      </div>

      <ApplicationsList
        canManageDrafts={canManageDrafts}
        applications={applications}
        loading={listQuery.isLoading}
        stateFilter={stateFilter}
        stateOptions={applicationStates}
        onStateFilterChange={setStateFilter}
        onCreateApplication={openCreateModal}
        onViewApplication={setSelectedId}
        onContinueDraft={openUpdateModal}
      />

      <ApplicationDetailsDrawer
        open={Boolean(selectedId)}
        selectedApplication={selectedApplication}
        canManageDrafts={canManageDrafts}
        busy={busy}
        uploadedDocsMap={uploadedDocsMap}
        requiredDocumentTypes={requiredDocumentTypes}
        missingRequiredDocuments={missingRequiredDocuments}
        onClose={() => setSelectedId(null)}
        onViewDocument={handleViewDocument}
        onOpenUpdateModal={openUpdateModal}
        onSubmitApplication={submitApplication}
      />

      <Modal
        title="Create Application"
        open={isCreateModalOpen}
        width={700}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <NewApplication
          form={createForm}
          applicationId={draftInWizard?.id}
          missingRequiredDocuments={missingRequiredDocuments}
          uploadedDocsMap={uploadedDocsMap}
          onViewDocument={handleViewDocument}
          onStepSave={async () => createDraft({ closeAfterSave: false })}
          onSubmit={async () => createDraft({ closeAfterSave: true })}
          onFinalSubmit={handleCreateWizardFinalSubmit}
          finalSubmitLabel="Submit Application"
          isSubmitting={
            createDraftMutation.isPending ||
            updateDraftMutation.isPending ||
            submitMutation.isPending
          }
        />
      </Modal>

      <Modal
        title={
          editingDraft?.current_state === "INFO_REQUESTED"
            ? "Respond To Information Request"
            : "Update Draft Application"
        }
        open={isUpdateModalOpen}
        width={700}
        onCancel={() => {
          closeUpdateModal();
        }}
        footer={null}
        destroyOnClose
      >
        {editingDraft?.current_state === "INFO_REQUESTED" ? (
          <RespondToRequest
            form={updateForm}
            applicationId={editingDraft.id}
            application={responseTargetApplication ?? editingDraft}
            uploadedDocsMap={uploadedDocsMap}
            onViewDocument={handleViewDocument}
            onDocumentsChanged={handleInfoRequestDocumentsChanged}
            onSaveUpdates={handleInfoRequestSaveUpdates}
            onResubmit={handleInfoRequestResubmit}
            isSubmitting={
              updateDraftMutation.isPending ||
              resubmitMutation.isPending ||
              submitMutation.isPending
            }
          />
        ) : (
          <NewApplication
            form={updateForm}
            applicationId={editingDraft?.id}
            missingRequiredDocuments={missingRequiredDocuments}
            uploadedDocsMap={uploadedDocsMap}
            onViewDocument={handleViewDocument}
            onStepSave={handleDraftStepSave}
            onSubmit={handleDraftSubmit}
            onFinalSubmit={handleDraftFinalSubmit}
            finalSubmitLabel="Submit Application"
            isSubmitting={
              updateDraftMutation.isPending || submitMutation.isPending
            }
          />
        )}
      </Modal>

      <FileViewModal
        open={viewingFile !== null}
        onClose={() => setViewingFile(null)}
        fileBlob={viewingFile?.blob ?? null}
        title={viewingFile?.title}
      />
    </Space>
  );
};

export default ApplicationsPage;
