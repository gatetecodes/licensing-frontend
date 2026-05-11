import { Form } from "antd";
import { useState } from "react";

import { useAuthSession } from "@/features/auth/hooks/use-auth";
import { isApplicant } from "@/features/auth/utils/role.utils";
import { useApplicationsPageData } from "./use-applications-page-data";
import { useApplicationsPageWorkflows } from "./use-applications-page-workflows";
import type { NewApplicationFormValues } from "../components/new-application";
import type { Application, ApplicationState } from "../types/applications.types";
export { applicationStates, requiredDocumentTypes } from "./applications.constants";
import { requiredDocumentTypes } from "./applications.constants";

export const useApplicationsPageController = () => {
  const { user } = useAuthSession();
  const canManageDrafts = isApplicant(user);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [draftInWizard, setDraftInWizard] = useState<Application | null>(null);
  const [editingDraft, setEditingDraft] = useState<Application | null>(null);
  const [viewingFile, setViewingFile] = useState<{
    blob: Blob;
    title: string;
  } | null>(null);
  const [stateFilter, setStateFilter] = useState<ApplicationState | undefined>();

  const [createForm] = Form.useForm<NewApplicationFormValues>();
  const [updateForm] = Form.useForm<NewApplicationFormValues>();

  const {
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
  } = useApplicationsPageData({
    userId: user?.id,
    userRoleName: user?.role?.name,
    canManageDrafts,
    stateFilter,
    selectedId,
    editingDraft,
    draftInWizard,
    requiredDocumentTypes
  });

  const {
    closeUpdateModal,
    handleViewDocument,
    createDraft,
    submitApplication,
    openCreateModal,
    openUpdateModal,
    handleInfoRequestDocumentsChanged,
    handleInfoRequestSaveUpdates,
    handleInfoRequestResubmit,
    handleDraftStepSave,
    handleDraftSubmit,
    handleDraftFinalSubmit,
    handleCreateWizardFinalSubmit
  } = useApplicationsPageWorkflows({
    userInstitutionName: user?.institution_name,
    createForm,
    updateForm,
    selectedId,
    draftInWizard,
    editingDraft,
    setSelectedId,
    setIsCreateModalOpen,
    setIsUpdateModalOpen,
    setDraftInWizard,
    setEditingDraft,
    setViewingFile,
    createDraftMutation,
    updateDraftMutation,
    submitMutation,
    resubmitMutation,
    listQuery,
    detailQuery,
    responseDetailQuery,
    docsQuery
  });

  const responseTargetApplication =
    responseDetailQuery.data?.application ?? editingDraft ?? null;

  return {
    user,
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
  };
};
