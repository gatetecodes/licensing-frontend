import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Dropdown,
  Modal,
  Select,
  Space,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";

import { getAxiosApiErrorMessage } from "@/lib/api-error";
import { feedback } from "@/lib/feedback/feedback-bridge";
import { Table } from "@/components/table";
import { StatusIndicator } from "@/components/status-indicator";
import { FileViewModal } from "@/components/file-view-modal";
import { useAuthSession } from "@/features/auth/hooks/use-auth";
import { isApplicant } from "@/features/auth/utils/role.utils";
import { useApplicationDocuments } from "@/features/documents/hooks/use-documents";
import { documentsService } from "@/features/documents/services/documents.service";
import type { DocumentType } from "@/features/documents/types/documents.types";
import {
  useApplicationDetail,
  useApplicationsList,
  useCreateApplicationDraft,
  useResubmitApplication,
  useSubmitApplication,
  useUpdateApplicationDraft,
} from "../hooks/use-applications";
import type {
  Application,
  ApplicationState,
  WorkflowResponseItem,
} from "../types/applications.types";
import NewApplication, {
  type NewApplicationFormValues,
} from "../components/new-application";
import RespondToRequest from "../components/respond-to-request";

const { Title, Paragraph } = Typography;

const applicationStates: ApplicationState[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "INFO_REQUESTED",
  "RESUBMITTED",
  "READY_FOR_DECISION",
  "APPROVED",
  "REJECTED",
];
const requiredDocumentTypes: DocumentType[] = [
  "BUSINESS_PLAN",
  "CERTIFICATE_OF_INCORPORATION",
  "SHAREHOLDING_STRUCTURE",
  "CAPITAL_ADEQUACY_EVIDENCE",
  "GOVERNANCE_DOCUMENT",
];

type AntdValidationError = {
  errorFields?: Array<unknown>;
};

const isAntdValidationError = (error: unknown): error is AntdValidationError =>
  Boolean(
    error &&
    typeof error === "object" &&
    Array.isArray((error as AntdValidationError).errorFields),
  );

const ApplicationsPage = () => {
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
  const [stateFilter, setStateFilter] = useState<
    ApplicationState | undefined
  >();
  const [createForm] = Form.useForm<NewApplicationFormValues>();
  const [updateForm] = Form.useForm<NewApplicationFormValues>();

  const listQuery = useApplicationsList({
    state: stateFilter,
    viewerId: user?.id,
    viewerRole: user?.role?.name,
    enabled: Boolean(user),
  });
  const detailQuery = useApplicationDetail(selectedId ?? undefined);
  const responseDetailQuery = useApplicationDetail(
    editingDraft?.current_state === "INFO_REQUESTED"
      ? editingDraft.id
      : undefined,
  );
  const docsQuery = useApplicationDocuments(
    editingDraft?.id ?? selectedId ?? undefined,
  );
  const createDraftMutation = useCreateApplicationDraft();
  const updateDraftMutation = useUpdateApplicationDraft();
  const submitMutation = useSubmitApplication();
  const resubmitMutation = useResubmitApplication();

  const selectedApplication = detailQuery.data?.application;
  const apps = useMemo(() => {
    const items = listQuery.data?.items ?? [];
    if (!canManageDrafts || !user) {
      return items;
    }
    return items.filter((item) => item.applicant_id === user.id);
  }, [canManageDrafts, listQuery.data?.items, user]);

  const handleViewDocument = async (versionId: string, title: string) => {
    try {
      const { blob } = await documentsService.downloadVersion(versionId);
      setViewingFile({ blob, title });
    } catch (error) {
      feedback.error(
        getAxiosApiErrorMessage(error, "Failed to load document."),
      );
    }
  };

  const busy =
    createDraftMutation.isPending ||
    updateDraftMutation.isPending ||
    submitMutation.isPending ||
    resubmitMutation.isPending;

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
          ...values,
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
    },
  ) => {
    try {
      const values = options?.validateBeforeSave
        ? await updateForm.validateFields()
        : updateForm.getFieldsValue(true);

      const completeDraftPayload = {
        institution_name:
          values.institution_name ??
          application.institution_name ??
          user?.institution_name ??
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
        business_summary: values.business_summary ?? application.business_summary,
      };

      const response = await updateDraftMutation.mutateAsync({
        id: application.id,
        lock_version: application.lock_version,
        ...completeDraftPayload,
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
        lock_version: application.lock_version,
      });
      feedback.success("Application submitted successfully.");
      await listQuery.refetch();
      if (selectedId === application.id) {
        await detailQuery.refetch();
      }
      return "Application submitted";
    } catch (error) {
      feedback.error(
        getAxiosApiErrorMessage(error, "Unable to submit application."),
      );
      return "Failed to submit";
    }
  };

  const onResubmit = async (
    application: Application,
    responses: WorkflowResponseItem[],
  ) => {
    try {
      await resubmitMutation.mutateAsync({
        id: application.id,
        lock_version: application.lock_version,
        responses,
      });
      feedback.success("Application resubmitted successfully.");

      const refetchPromises: Promise<unknown>[] = [listQuery.refetch()];

      if (selectedId === application.id) {
        refetchPromises.push(detailQuery.refetch());
      }

      if (editingDraft?.id === application.id && editingDraft?.current_state === "INFO_REQUESTED") {
        refetchPromises.push(responseDetailQuery.refetch());
      }

      await Promise.all(refetchPromises);
      return "Application resubmitted";
    } catch (error) {
      feedback.error(
        getAxiosApiErrorMessage(error, "Unable to resubmit application."),
      );
      return "Unable to resubmit application.";
    }
  };

  const selectedStateTag = useMemo(
    () =>
      selectedApplication ? (
        <StatusIndicator status={selectedApplication.current_state} />
      ) : null,
    [selectedApplication],
  );
  const { missingRequiredDocuments, uploadedDocsMap } = useMemo(() => {
    const uploaded = new Map<string, string>();
    (docsQuery.data?.items ?? []).forEach((item) => {
      if (item.latest_version) {
        uploaded.set(item.document_type, item.latest_version.id);
      }
    });
    return {
      missingRequiredDocuments: requiredDocumentTypes.filter(
        (type) => !uploaded.has(type),
      ),
      uploadedDocsMap: uploaded,
    };
  }, [docsQuery.data?.items]);

  const openCreateModal = () => {
    createForm.resetFields();
    createForm.setFieldValue("institution_name", user?.institution_name ?? "");
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
      business_summary: application.business_summary ?? "",
    });
    setEditingDraft(application);
    setIsUpdateModalOpen(true);
  };

  const responseTargetApplication =
    responseDetailQuery.data?.application ?? editingDraft ?? null;

  return (
    <Space direction="vertical" size={16} className="w-full">
      <div>
        <Title level={2}>Applications</Title>
        <Paragraph type="secondary">
          Track application lifecycle from draft creation to final decision.
        </Paragraph>
      </div>

      <Card
        bordered={false}
        title="Application List"
        className="shadow-none!"
        extra={
          <Space>
            {canManageDrafts ? (
              <Button
                type="primary"
                onClick={openCreateModal}
                className="shadow-none!"
              >
                Create Application
              </Button>
            ) : null}
            <Select
              allowClear
              placeholder="Filter by state"
              style={{ minWidth: 200 }}
              value={stateFilter}
              onChange={(value) => setStateFilter(value)}
              options={applicationStates.map((value) => ({
                value,
                label: value,
              }))}
            />
          </Space>
        }
      >
        <Table
          isPlainTable
          rowKey="id"
          loading={listQuery.isLoading}
          dataSource={apps}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: "Reference", dataIndex: "reference_number" },
            { title: "Institution", dataIndex: "institution_name" },
            {
              title: "State",
              dataIndex: "current_state",
              render: (value: ApplicationState) => (
                <StatusIndicator status={value} />
              ),
            },
            {
              title: "Updated",
              dataIndex: "updated_at",
              render: (value: string) => (
                <span>{new Date(value).toLocaleString()}</span>
              ),
            },
            {
              title: "Action",
              render: (_, record) => {
                const actionItems: MenuProps["items"] = [
                  {
                    key: "view",
                    label: "View",
                    onClick: () => setSelectedId(record.id),
                  },
                  ...(canManageDrafts &&
                  (record.current_state === "DRAFT" ||
                    record.current_state === "INFO_REQUESTED")
                    ? [
                        {
                          key: "continue-draft",
                          label:
                            record.current_state === "DRAFT"
                              ? "Continue Draft"
                              : "Respond To Request",
                          onClick: () => openUpdateModal(record),
                        },
                      ]
                    : []),
                ];

                return (
                  <Dropdown menu={{ items: actionItems }} trigger={["click"]}>
                    <Button
                      icon={<MoreOutlined />}
                      aria-label="Application actions"
                      className="shadow-none!"
                    />
                  </Dropdown>
                );
              },
            },
          ]}
        />
      </Card>

      <Drawer
        title="Application Details"
        width={620}
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
      >
        {selectedApplication ? (
          <Space direction="vertical" className="w-full">
            {selectedStateTag}
            {canManageDrafts &&
            selectedApplication.current_state === "INFO_REQUESTED" ? (
              <Alert
                type="warning"
                showIcon
                message="Additional Information Requested"
                description={
                  <Space direction="vertical" size={4}>
                    <Typography.Text type="secondary">
                      Requested at:{" "}
                      {selectedApplication.latest_info_request?.requested_at
                        ? new Date(
                            selectedApplication.latest_info_request.requested_at,
                          ).toLocaleString()
                        : "N/A"}
                    </Typography.Text>
                    <Typography.Text>
                      {selectedApplication.latest_info_request?.reviewer_summary_note?.trim() ??
                        "Reviewer requested updates. Please update the application fields and/or upload the requested document(s) before resubmitting."}
                    </Typography.Text>
                    {(selectedApplication.latest_info_request?.request_items ?? []).map(
                      (item, index) => (
                        <Typography.Text key={item.id}>
                          {index + 1}. {item.type.replaceAll("_", " ")}:{" "}
                          {item.instruction}
                        </Typography.Text>
                      ),
                    )}
                  </Space>
                }
              />
            ) : null}
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Reference">
                {selectedApplication.reference_number}
              </Descriptions.Item>
              <Descriptions.Item label="Institution">
                {selectedApplication.institution_name}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {selectedApplication.institution_type}
              </Descriptions.Item>
              <Descriptions.Item label="License Category">
                {selectedApplication.license_category ?? "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="License Category Details">
                {selectedApplication.license_category_other_details ?? "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Business Address">
                {selectedApplication.business_address ?? "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Contact Name">
                {selectedApplication.contact_name ?? "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Contact Email">
                {selectedApplication.contact_email ?? "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Contact Phone">
                {selectedApplication.contact_phone ?? "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Incorporation Date">
                {selectedApplication.incorporation_date ?? "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Paid-up Capital (RWF)">
                {selectedApplication.capital_amount_rwf ?? "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Business Summary">
                {selectedApplication.business_summary ?? "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="State">
                {selectedApplication.current_state}
              </Descriptions.Item>
              <Descriptions.Item label="Decision Reason">
                {selectedApplication.decision_reason ?? "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Review Note">
                {selectedApplication.latest_review?.notes ?? "N/A"}
              </Descriptions.Item>
            </Descriptions>
            {canManageDrafts &&
            selectedApplication.current_state === "DRAFT" ? (
              <Space direction="vertical" className="w-full mb-4">
                <Typography.Text strong>Documents Readiness</Typography.Text>
                {requiredDocumentTypes.map((type) => {
                  const versionId = uploadedDocsMap.get(type);
                  const missing = !versionId;
                  return (
                    <div
                      key={type}
                      className="p-2 bg-secondary/10 rounded-md flex items-center justify-between"
                    >
                      <Typography.Text strong={!missing}>
                        {type.replaceAll("_", " ")}
                      </Typography.Text>
                      {missing ? (
                        <Typography.Text type="danger">
                          (missing)
                        </Typography.Text>
                      ) : (
                        <Space>
                          <Button
                            type="link"
                            size="small"
                            className="text-primary! hover:underline!"
                            onClick={() =>
                              void handleViewDocument(versionId, type)
                            }
                          >
                            View
                          </Button>
                          <Icon
                            icon="lucide:check-circle"
                            color="#52c41a"
                            width="18"
                          />
                        </Space>
                      )}
                    </div>
                  );
                })}
              </Space>
            ) : null}
            {canManageDrafts &&
            selectedApplication.current_state === "DRAFT" ? (
              <Space>
                <Button
                  loading={busy}
                  onClick={() => openUpdateModal(selectedApplication)}
                >
                  Update Draft
                </Button>
                <Button
                  type="primary"
                  disabled={missingRequiredDocuments.length > 0}
                  loading={busy}
                  onClick={() => submitApplication(selectedApplication)}
                >
                  Submit Application
                </Button>
              </Space>
            ) : null}
            {canManageDrafts &&
            selectedApplication.current_state === "INFO_REQUESTED" ? (
              <Space>
                <Button
                  loading={busy}
                  onClick={() => openUpdateModal(selectedApplication)}
                >
                  Respond To Request
                </Button>
              </Space>
            ) : null}
          </Space>
        ) : (
          <Paragraph type="secondary">
            Select an application to view details.
          </Paragraph>
        )}
      </Drawer>

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
          uploadedDocsMap={uploadedDocsMap}
          onViewDocument={handleViewDocument}
          onStepSave={async () => createDraft({ closeAfterSave: false })}
          onSubmit={async () => createDraft({ closeAfterSave: true })}
          isSubmitting={
            createDraftMutation.isPending || updateDraftMutation.isPending
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
          setIsUpdateModalOpen(false);
          setEditingDraft(null);
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
            onDocumentsChanged={async () => {
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
            }}
            onSaveUpdates={async () => {
              const result = await updateDraft(editingDraft, {
                closeAfterSave: false,
                showMessage: true,
                validateBeforeSave: false,
              });
              if (result.application) {
                setEditingDraft(result.application);
              }
              return result.message;
            }}
            onResubmit={async (responses) => {
              const result = await updateDraft(editingDraft, {
                closeAfterSave: false,
                showMessage: false,
                validateBeforeSave: true,
              });
              if (!result.application) {
                return "Unable to save updates.";
              }
              const message = await onResubmit(result.application, responses);
              if (message === "Application resubmitted") {
                setEditingDraft(null);
                setIsUpdateModalOpen(false);
              }
              return message;
            }}
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
            onStepSave={async () => {
              if (!editingDraft) {
                return;
              }
              const result = await updateDraft(editingDraft, {
                closeAfterSave: false,
                showMessage: false,
                validateBeforeSave: false,
              });
              if (result.application) {
                setEditingDraft(result.application);
              }
              return result.message;
            }}
            onSubmit={async () => {
              if (!editingDraft) {
                return;
              }
              const result = await updateDraft(editingDraft, {
                closeAfterSave: true,
                showMessage: true,
                validateBeforeSave: true,
              });
              setEditingDraft(null);
              return result.message;
            }}
            onFinalSubmit={async () => {
              if (!editingDraft) {
                return;
              }
              const result = await updateDraft(editingDraft, {
                closeAfterSave: true,
                showMessage: false,
                validateBeforeSave: true,
              });
              if (result.application) {
                const msg = await submitApplication(result.application);
                setEditingDraft(null);
                return msg;
              }
              return "Unable to save draft.";
            }}
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
