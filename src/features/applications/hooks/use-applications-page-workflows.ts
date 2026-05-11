import type { Dispatch, SetStateAction } from "react";
import type { FormInstance } from "antd";

import { getAxiosApiErrorMessage } from "@/lib/api-error";
import { feedback } from "@/lib/feedback/feedback-bridge";
import { documentsService } from "@/features/documents/services/documents.service";
import type { Application, WorkflowResponseItem } from "../types/applications.types";
import type { NewApplicationFormValues } from "../components/new-application";
import {
  useCreateApplicationDraft,
  useResubmitApplication,
  useSubmitApplication,
  useUpdateApplicationDraft
} from "./use-applications";

type QueryRefetchLike = {
  refetch: () => Promise<unknown>;
};

type UseApplicationsPageWorkflowsParams = {
  userInstitutionName?: string;
  createForm: FormInstance<NewApplicationFormValues>;
  updateForm: FormInstance<NewApplicationFormValues>;
  selectedId: string | null;
  draftInWizard: Application | null;
  editingDraft: Application | null;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  setIsCreateModalOpen: Dispatch<SetStateAction<boolean>>;
  setIsUpdateModalOpen: Dispatch<SetStateAction<boolean>>;
  setDraftInWizard: Dispatch<SetStateAction<Application | null>>;
  setEditingDraft: Dispatch<SetStateAction<Application | null>>;
  setViewingFile: Dispatch<SetStateAction<{ blob: Blob; title: string } | null>>;
  createDraftMutation: ReturnType<typeof useCreateApplicationDraft>;
  updateDraftMutation: ReturnType<typeof useUpdateApplicationDraft>;
  submitMutation: ReturnType<typeof useSubmitApplication>;
  resubmitMutation: ReturnType<typeof useResubmitApplication>;
  listQuery: QueryRefetchLike;
  detailQuery: QueryRefetchLike;
  responseDetailQuery: QueryRefetchLike;
  docsQuery: QueryRefetchLike;
};

type AntdValidationError = {
  errorFields?: Array<unknown>;
};

const isAntdValidationError = (error: unknown): error is AntdValidationError =>
  Boolean(
    error &&
      typeof error === "object" &&
      Array.isArray((error as AntdValidationError).errorFields)
  );

export const useApplicationsPageWorkflows = ({
  userInstitutionName,
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
}: UseApplicationsPageWorkflowsParams) => {
  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setEditingDraft(null);
  };

  const handleViewDocument = async (versionId: string, title: string) => {
    try {
      const { blob } = await documentsService.downloadVersion(versionId);
      setViewingFile({ blob, title });
    } catch (error) {
      feedback.error(getAxiosApiErrorMessage(error, "Failed to load document."));
    }
  };

  const createDraft = async (options?: { closeAfterSave?: boolean }) => {
    try {
      const values = createForm.getFieldsValue(true);
      let saved: Application;
      if (!draftInWizard) {
        const response = await createDraftMutation.mutateAsync(values);
        saved = response.application;
      } else {
        const response = await updateDraftMutation.mutateAsync({
          id: draftInWizard.id,
          lock_version: draftInWizard.lock_version,
          ...values
        });
        saved = response.application;
      }
      setDraftInWizard(saved);
      if (options?.closeAfterSave) {
        createForm.resetFields();
        setIsCreateModalOpen(false);
      }
      return "Draft saved.";
    } catch (error) {
      if (error instanceof Error && error.message.includes("validation")) {
        return "Fix validation errors before continuing.";
      }
      feedback.error(getAxiosApiErrorMessage(error, "Failed to create draft."));
      return "Unable to save draft.";
    }
  };

  const updateDraft = async (
    application: Application,
    options?: {
      closeAfterSave?: boolean;
      showMessage?: boolean;
      validateBeforeSave?: boolean;
    }
  ) => {
    try {
      const values = options?.validateBeforeSave
        ? await updateForm.validateFields()
        : updateForm.getFieldsValue(true);

      const completeDraftPayload = {
        institution_name:
          values.institution_name ??
          application.institution_name ??
          userInstitutionName ??
          "",
        institution_type: values.institution_type ?? application.institution_type,
        business_address: values.business_address ?? application.business_address,
        contact_name: values.contact_name ?? application.contact_name,
        contact_email: values.contact_email ?? application.contact_email,
        contact_phone: values.contact_phone ?? application.contact_phone,
        license_category: values.license_category ?? application.license_category,
        license_category_other_details:
          values.license_category_other_details ??
          application.license_category_other_details,
        capital_amount_rwf:
          values.capital_amount_rwf ?? application.capital_amount_rwf,
        incorporation_date:
          values.incorporation_date ?? application.incorporation_date,
        business_summary: values.business_summary ?? application.business_summary
      };

      const response = await updateDraftMutation.mutateAsync({
        id: application.id,
        lock_version: application.lock_version,
        ...completeDraftPayload
      });
      if (options?.showMessage ?? true) {
        feedback.success("Draft updated.");
      }
      if (options?.closeAfterSave ?? true) {
        setIsUpdateModalOpen(false);
      }
      if (selectedId === response.application.id) {
        setSelectedId(response.application.id);
      }
      return { message: "Draft saved.", application: response.application };
    } catch (error) {
      if (
        isAntdValidationError(error) ||
        (error instanceof Error && error.message.includes("validation"))
      ) {
        return { message: "Fix validation errors before continuing." };
      }
      feedback.error(getAxiosApiErrorMessage(error, "Failed to update draft."));
      return { message: "Unable to save draft." };
    }
  };

  const submitApplication = async (application: Application) => {
    try {
      await submitMutation.mutateAsync({
        id: application.id,
        lock_version: application.lock_version
      });
      feedback.success("Application submitted successfully.");
      await listQuery.refetch();
      if (selectedId === application.id) {
        await detailQuery.refetch();
      }
      return "Application submitted";
    } catch (error) {
      feedback.error(getAxiosApiErrorMessage(error, "Unable to submit application."));
      return "Failed to submit";
    }
  };

  const resubmitApplication = async (
    application: Application,
    responses: WorkflowResponseItem[]
  ) => {
    try {
      await resubmitMutation.mutateAsync({
        id: application.id,
        lock_version: application.lock_version,
        responses
      });
      feedback.success("Application resubmitted successfully.");

      const refetchPromises: Promise<unknown>[] = [listQuery.refetch()];
      if (selectedId === application.id) {
        refetchPromises.push(detailQuery.refetch());
      }
      if (
        editingDraft?.id === application.id &&
        editingDraft?.current_state === "INFO_REQUESTED"
      ) {
        refetchPromises.push(responseDetailQuery.refetch());
      }

      await Promise.all(refetchPromises);
      return "Application resubmitted";
    } catch (error) {
      feedback.error(
        getAxiosApiErrorMessage(error, "Unable to resubmit application.")
      );
      return "Unable to resubmit application.";
    }
  };

  const openCreateModal = () => {
    createForm.resetFields();
    createForm.setFieldValue("institution_name", userInstitutionName ?? "");
    setDraftInWizard(null);
    setIsCreateModalOpen(true);
  };

  const openUpdateModal = (application: Application) => {
    updateForm.setFieldsValue({
      institution_name: application.institution_name,
      institution_type: application.institution_type,
      business_address: application.business_address ?? "",
      contact_name: application.contact_name ?? "",
      contact_email: application.contact_email ?? "",
      contact_phone: application.contact_phone ?? "",
      license_category: application.license_category ?? "COMMERCIAL_BANK",
      license_category_other_details:
        application.license_category_other_details ?? "",
      capital_amount_rwf: application.capital_amount_rwf,
      incorporation_date: application.incorporation_date ?? "",
      business_summary: application.business_summary ?? ""
    });
    setEditingDraft(application);
    setIsUpdateModalOpen(true);
  };

  const handleInfoRequestDocumentsChanged = async () => {
    const refetchPromises: Promise<unknown>[] = [];
    if (editingDraft?.id || selectedId) {
      refetchPromises.push(docsQuery.refetch());
    }
    if (selectedId) {
      refetchPromises.push(detailQuery.refetch());
    }
    if (editingDraft?.id && editingDraft.current_state === "INFO_REQUESTED") {
      refetchPromises.push(responseDetailQuery.refetch());
    }
    await Promise.all(refetchPromises);
  };

  const handleInfoRequestSaveUpdates = async () => {
    if (!editingDraft) {
      return "Unable to save updates.";
    }
    const result = await updateDraft(editingDraft, {
      closeAfterSave: false,
      showMessage: true,
      validateBeforeSave: false
    });
    if (result.application) {
      setEditingDraft(result.application);
    }
    return result.message;
  };

  const handleInfoRequestResubmit = async (responses: WorkflowResponseItem[]) => {
    if (!editingDraft) {
      return "Unable to save updates.";
    }
    const result = await updateDraft(editingDraft, {
      closeAfterSave: false,
      showMessage: false,
      validateBeforeSave: true
    });
    if (!result.application) {
      return "Unable to save updates.";
    }
    const message = await resubmitApplication(result.application, responses);
    if (message === "Application resubmitted") {
      closeUpdateModal();
    }
    return message;
  };

  const handleDraftStepSave = async () => {
    if (!editingDraft) {
      return;
    }
    const result = await updateDraft(editingDraft, {
      closeAfterSave: false,
      showMessage: false,
      validateBeforeSave: false
    });
    if (result.application) {
      setEditingDraft(result.application);
    }
    return result.message;
  };

  const handleDraftSubmit = async () => {
    if (!editingDraft) {
      return;
    }
    const result = await updateDraft(editingDraft, {
      closeAfterSave: true,
      showMessage: true,
      validateBeforeSave: true
    });
    setEditingDraft(null);
    return result.message;
  };

  const handleDraftFinalSubmit = async () => {
    if (!editingDraft) {
      return;
    }
    const result = await updateDraft(editingDraft, {
      closeAfterSave: false,
      showMessage: false,
      validateBeforeSave: true
    });
    if (result.application) {
      const message = await submitApplication(result.application);
      if (message === "Application submitted") {
        closeUpdateModal();
      }
      return message;
    }
    return "Unable to save draft.";
  };

  const handleCreateWizardFinalSubmit = async () => {
    if (!draftInWizard) {
      return "Unable to submit.";
    }
    try {
      await createForm.validateFields();
    } catch {
      return "Fix validation errors before continuing.";
    }
    try {
      const values = createForm.getFieldsValue(true);
      const response = await updateDraftMutation.mutateAsync({
        id: draftInWizard.id,
        lock_version: draftInWizard.lock_version,
        ...values
      });
      const saved = response.application;
      setDraftInWizard(saved);
      const message = await submitApplication(saved);
      if (message === "Application submitted") {
        createForm.resetFields();
        setDraftInWizard(null);
        setIsCreateModalOpen(false);
      }
      return message;
    } catch (error) {
      if (isAntdValidationError(error)) {
        return "Fix validation errors before continuing.";
      }
      feedback.error(getAxiosApiErrorMessage(error, "Unable to submit application."));
      return "Unable to submit.";
    }
  };

  return {
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
  };
};
