import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Dropdown,
  Input,
  Modal,
  Select,
  Space,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";

import { StatusIndicator } from "@/components/status-indicator";
import { Table } from "@/components/table";
import { FileViewModal } from "@/components/file-view-modal";
import {
  useApplicationDetail,
  useApplicationsList,
} from "@/features/applications/hooks/use-applications";
import type {
  Application,
  ApplicationState,
  WorkflowFieldKey,
  WorkflowRequestItemType,
} from "@/features/applications/types/applications.types";
import { useAuthSession } from "@/features/auth/hooks/use-auth";
import { isApprover, isReviewer } from "@/features/auth/utils/role.utils";
import { useApplicationDocuments } from "@/features/documents/hooks/use-documents";
import { documentsService } from "@/features/documents/services/documents.service";
import type { DocumentType } from "@/features/documents/types/documents.types";
import { getAxiosApiErrorMessage } from "@/lib/api-error";
import { feedback } from "@/lib/feedback/feedback-bridge";
import {
  useApproveMutation,
  useMarkReadyForDecisionMutation,
  useRejectMutation,
  useRequestInformationMutation,
  useStartReviewMutation,
} from "../hooks/use-workflow";

const { Title, Paragraph } = Typography;

const requiredDocumentTypes: DocumentType[] = [
  "BUSINESS_PLAN",
  "CERTIFICATE_OF_INCORPORATION",
  "SHAREHOLDING_STRUCTURE",
  "CAPITAL_ADEQUACY_EVIDENCE",
  "GOVERNANCE_DOCUMENT",
];

const requestTypeOptions: Array<{
  value: WorkflowRequestItemType;
  label: string;
}> = [
  { value: "FIELD_UPDATE", label: "Field Update" },
  { value: "DOCUMENT_REPLACEMENT", label: "Document Replacement" },
  { value: "ADDITIONAL_DOCUMENT", label: "Additional Document" },
  { value: "OPEN_QUESTION", label: "Open Question" },
];

const fieldKeyOptions: Array<{ value: WorkflowFieldKey; label: string }> = [
  { value: "institution_name", label: "Institution Name" },
  { value: "institution_type", label: "Institution Type" },
  { value: "business_address", label: "Business Address" },
  { value: "contact_name", label: "Primary Contact Name" },
  { value: "contact_email", label: "Primary Contact Email" },
  { value: "contact_phone", label: "Primary Contact Phone" },
  { value: "license_category", label: "License Category" },
  {
    value: "license_category_other_details",
    label: "License Category Other Details",
  },
  { value: "capital_amount_rwf", label: "Paid-up Capital" },
  { value: "incorporation_date", label: "Incorporation Date" },
  { value: "business_summary", label: "Business Summary" },
];

type RequestDraftRow = {
  id: string;
  type: WorkflowRequestItemType;
  instruction: string;
  field_key?: WorkflowFieldKey;
  document_type?: DocumentType;
  required: boolean;
};

const createRow = (): RequestDraftRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  type: "OPEN_QUESTION",
  instruction: "",
  required: true,
});

const ReviewQueuePage = () => {
  const { user } = useAuthSession();
  const listQuery = useApplicationsList({
    viewerId: user?.id,
    viewerRole: user?.role?.name,
    enabled: Boolean(user),
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<{
    blob: Blob;
    title: string;
  } | null>(null);
  const [actionApplication, setActionApplication] =
    useState<Application | null>(null);
  const [activeAction, setActiveAction] = useState<
    "REQUEST_INFO" | "MARK_READY" | "DECIDE" | null
  >(null);
  const [requestRows, setRequestRows] = useState<RequestDraftRow[]>([
    createRow(),
  ]);
  const [reviewerSummaryNote, setReviewerSummaryNote] = useState("");
  const [readyNote, setReadyNote] = useState("");
  const [decisionReason, setDecisionReason] = useState("");

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

  const { uploadedDocsMap } = useMemo(() => {
    const uploaded = new Map<string, string>();
    (docsQuery.data?.items ?? []).forEach((item) => {
      if (item.latest_version) {
        uploaded.set(item.document_type, item.latest_version.id);
      }
    });
    return {
      uploadedDocsMap: uploaded,
    };
  }, [docsQuery.data?.items]);

  const handleViewDocument = async (versionId: string, type: string) => {
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
  };

  const resetActionState = () => {
    setActionApplication(null);
    setActiveAction(null);
    setRequestRows([createRow()]);
    setReviewerSummaryNote("");
    setReadyNote("");
    setDecisionReason("");
  };

  const mutateWithFeedback = async (
    run: () => Promise<unknown>,
    successMessage: string,
  ) => {
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
  };

  const canReview = isReviewer(user);
  const canDecide = isApprover(user);

  const validateRequestRows = () => {
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
  };

  return (
    <Space direction="vertical" size={16} className="w-full">
      <div>
        <Title level={2}>Review Queue</Title>
        <Paragraph type="secondary">
          Execute explicit workflow transitions as reviewer or approver.
        </Paragraph>
      </div>
      <div className="w-full bg-white p-4 rounded-md">
        <Table
          isPlainTable
          loading={listQuery.isLoading}
          rowKey="id"
          dataSource={(listQuery.data?.items ?? []).filter(
            (item) => item.current_state !== "DRAFT",
          )}
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
              title: "Actions",
              render: (_, record: Application) => {
                const actionItems: MenuProps["items"] = [
                  {
                    key: "view",
                    label: "View Details",
                    onClick: () => setSelectedId(record.id),
                  },
                ];

                if (
                  canReview &&
                  (record.current_state === "SUBMITTED" ||
                    record.current_state === "RESUBMITTED")
                ) {
                  actionItems.push({
                    key: "start-review",
                    label: "Start Review",
                    onClick: () =>
                      void mutateWithFeedback(
                        () =>
                          startReview.mutateAsync({
                            id: record.id,
                            lock_version: record.lock_version,
                          }),
                        "Review started.",
                      ),
                  });
                }

                if (canReview && record.current_state === "UNDER_REVIEW") {
                  actionItems.push({
                    key: "request-info",
                    label: "Request Information",
                    onClick: () => {
                      setActionApplication(record);
                      setActiveAction("REQUEST_INFO");
                    },
                  });
                  actionItems.push({
                    key: "mark-ready",
                    label: "Mark Ready for Decision",
                    onClick: () => {
                      setActionApplication(record);
                      setActiveAction("MARK_READY");
                    },
                  });
                }

                if (
                  canDecide &&
                  record.current_state === "READY_FOR_DECISION"
                ) {
                  actionItems.push({
                    key: "decide",
                    label: "Make Decision",
                    onClick: () => {
                      setActionApplication(record);
                      setActiveAction("DECIDE");
                    },
                  });
                }

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
      </div>

      <Drawer
        title="Application Details"
        width={620}
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        footer={
          selectedApplication ? (
            <div className="flex justify-end py-2">
              {canReview &&
                (selectedApplication.current_state === "SUBMITTED" ||
                  selectedApplication.current_state === "RESUBMITTED") && (
                  <Button
                    type="primary"
                    loading={isBusy}
                    onClick={() =>
                      void mutateWithFeedback(
                        () =>
                          startReview.mutateAsync({
                            id: selectedApplication.id,
                            lock_version: selectedApplication.lock_version,
                          }),
                        "Review started.",
                      )
                    }
                  >
                    Start Review
                  </Button>
                )}
              {canReview &&
                selectedApplication.current_state === "UNDER_REVIEW" && (
                  <Space>
                    <Button
                      onClick={() => {
                        setActionApplication(selectedApplication);
                        setActiveAction("REQUEST_INFO");
                      }}
                    >
                      Request Information
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => {
                        setActionApplication(selectedApplication);
                        setActiveAction("MARK_READY");
                      }}
                    >
                      Mark Ready for Decision
                    </Button>
                  </Space>
                )}
              {canDecide &&
                selectedApplication.current_state === "READY_FOR_DECISION" && (
                  <Button
                    type="primary"
                    onClick={() => {
                      setActionApplication(selectedApplication);
                      setActiveAction("DECIDE");
                    }}
                  >
                    Make Decision
                  </Button>
                )}
            </div>
          ) : null
        }
      >
        {selectedApplication ? (
          <Space direction="vertical" className="w-full">
            <StatusIndicator status={selectedApplication.current_state} />
            {selectedApplication.latest_info_request ? (
              <Alert
                type="warning"
                showIcon
                message={
                  selectedApplication.current_state === "INFO_REQUESTED"
                    ? "Information Requested"
                    : "Latest Information Request Cycle"
                }
                description={
                  <Space direction="vertical" size={4}>
                    <Typography.Text type="secondary">
                      Requested at:{" "}
                      {selectedApplication.latest_info_request?.requested_at
                        ? new Date(
                            selectedApplication.latest_info_request
                              .requested_at,
                          ).toLocaleString()
                        : "N/A"}
                    </Typography.Text>
                    {selectedApplication.latest_info_request
                      ?.reviewer_summary_note ? (
                      <Typography.Text>
                        {
                          selectedApplication.latest_info_request
                            .reviewer_summary_note
                        }
                      </Typography.Text>
                    ) : null}
                    {(
                      selectedApplication.latest_info_request?.request_items ??
                      []
                    ).map((item, index) => (
                      <Space
                        key={item.id}
                        direction="vertical"
                        size={0}
                        className="w-full"
                      >
                        <Typography.Text>
                          {index + 1}. {item.type.replaceAll("_", " ")}:{" "}
                          {item.instruction}
                        </Typography.Text>
                        {item.type === "OPEN_QUESTION" ? (
                          <Typography.Text type="secondary">
                            Applicant response:{" "}
                            {selectedApplication.latest_info_request?.applicant_responses
                              ?.find(
                                (response) =>
                                  response.request_item_id === item.id,
                              )
                              ?.answer_text?.trim() || "No response submitted"}
                          </Typography.Text>
                        ) : null}
                        {(item.type === "DOCUMENT_REPLACEMENT" ||
                          item.type === "ADDITIONAL_DOCUMENT") &&
                        item.document_type ? (
                          <Typography.Text type="secondary">
                            Document update:{" "}
                            {uploadedDocsMap.has(item.document_type)
                              ? "Uploaded"
                              : "Not uploaded"}
                          </Typography.Text>
                        ) : null}
                      </Space>
                    ))}
                    <Typography.Text type="secondary">
                      Responded at:{" "}
                      {selectedApplication.latest_info_request?.responded_at
                        ? new Date(
                            selectedApplication.latest_info_request
                              .responded_at,
                          ).toLocaleString()
                        : "N/A"}
                    </Typography.Text>
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

            <Space direction="vertical" className="w-full mt-4">
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
                      <Typography.Text type="danger">(missing)</Typography.Text>
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
          </Space>
        ) : (
          <Paragraph type="secondary">
            Select an application to view details.
          </Paragraph>
        )}
      </Drawer>

      <Modal
        title={
          activeAction === "REQUEST_INFO"
            ? "Request Additional Information"
            : activeAction === "MARK_READY"
              ? "Mark Ready for Decision"
              : "Make Decision"
        }
        open={Boolean(actionApplication)}
        onCancel={resetActionState}
        footer={null}
        width={activeAction === "REQUEST_INFO" ? 800 : 520}
        destroyOnClose
      >
        {actionApplication ? (
          <Space direction="vertical" className="w-full py-4" size={24}>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <Space direction="vertical" size={4}>
                <Typography.Text
                  type="secondary"
                  className="text-xs uppercase tracking-wider font-semibold"
                >
                  Application Reference
                </Typography.Text>
                <Typography.Text strong className="text-lg">
                  {actionApplication.reference_number} —{" "}
                  {actionApplication.institution_name}
                </Typography.Text>
              </Space>
            </div>

            {activeAction === "REQUEST_INFO" ? (
              <>
                <div>
                  <Title level={5}>Information Request Items</Title>
                  <Paragraph type="secondary">
                    Specify the exact fields or documents that require updates
                    or clarification from the applicant.
                  </Paragraph>
                </div>

                <div className="flex flex-col gap-4">
                  {requestRows.map((row, index) => (
                    <Card
                      key={row.id}
                      size="small"
                      title={
                        <Space>
                          <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <span>Request Item</span>
                        </Space>
                      }
                      extra={
                        <Button
                          danger
                          type="text"
                          icon={<Icon icon="lucide:trash-2" />}
                          disabled={requestRows.length === 1}
                          onClick={() =>
                            setRequestRows((prev) =>
                              prev.filter((item) => item.id !== row.id),
                            )
                          }
                        >
                          Remove
                        </Button>
                      }
                      className="shadow-none! border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <Typography.Text strong className="text-xs">
                            Request Type
                          </Typography.Text>
                          <Select
                            className="w-full"
                            value={row.type}
                            options={requestTypeOptions}
                            onChange={(value) =>
                              setRequestRows((prev) =>
                                prev.map((item) =>
                                  item.id === row.id
                                    ? {
                                        ...item,
                                        type: value,
                                        field_key:
                                          value === "FIELD_UPDATE"
                                            ? item.field_key
                                            : undefined,
                                        document_type:
                                          value === "DOCUMENT_REPLACEMENT"
                                            ? item.document_type
                                            : value === "ADDITIONAL_DOCUMENT"
                                              ? "SUPPORTING_DOCUMENT"
                                              : undefined,
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </div>

                        {row.type === "FIELD_UPDATE" && (
                          <div className="space-y-1">
                            <Typography.Text strong className="text-xs">
                              Target Field
                            </Typography.Text>
                            <Select
                              className="w-full"
                              placeholder="Select field to update"
                              value={row.field_key}
                              options={fieldKeyOptions}
                              onChange={(value) =>
                                setRequestRows((prev) =>
                                  prev.map((item) =>
                                    item.id === row.id
                                      ? { ...item, field_key: value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </div>
                        )}

                        {row.type === "DOCUMENT_REPLACEMENT" && (
                          <div className="space-y-1">
                            <Typography.Text strong className="text-xs">
                              Target Document
                            </Typography.Text>
                            <Select
                              className="w-full"
                              placeholder="Select document to replace"
                              value={row.document_type}
                              options={requiredDocumentTypes.map((type) => ({
                                value: type,
                                label: type.replaceAll("_", " "),
                              }))}
                              onChange={(value) =>
                                setRequestRows((prev) =>
                                  prev.map((item) =>
                                    item.id === row.id
                                      ? { ...item, document_type: value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Typography.Text strong className="text-xs">
                          Instructions for Applicant
                        </Typography.Text>
                        <Input.TextArea
                          placeholder="Provide clear instructions on what needs to be fixed or provided..."
                          rows={3}
                          value={row.instruction}
                          onChange={(event) =>
                            setRequestRows((prev) =>
                              prev.map((item) =>
                                item.id === row.id
                                  ? { ...item, instruction: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                    </Card>
                  ))}
                </div>

                <Button
                  icon={<Icon icon="lucide:plus" />}
                  onClick={() =>
                    setRequestRows((prev) => [...prev, createRow()])
                  }
                  className="h-10"
                >
                  Add Another Request Item
                </Button>

                <div className="space-y-2">
                  <Typography.Text strong>
                    Reviewer Summary Note (Optional)
                  </Typography.Text>
                  <Input.TextArea
                    placeholder="Provide an overall summary of the information request..."
                    rows={3}
                    value={reviewerSummaryNote}
                    onChange={(event) =>
                      setReviewerSummaryNote(event.target.value)
                    }
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <Space size="middle">
                    <Button onClick={resetActionState}>Cancel</Button>
                    <Button
                      type="primary"
                      className="shadow-none!"
                      loading={isBusy}
                      icon={<Icon icon="lucide:send" />}
                      onClick={() => {
                        if (!validateRequestRows()) {
                          return;
                        }

                        void mutateWithFeedback(
                          () =>
                            requestInformation.mutateAsync({
                              id: actionApplication.id,
                              lock_version: actionApplication.lock_version,
                              reviewer_summary_note:
                                reviewerSummaryNote.trim() || undefined,
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
                      }}
                    >
                      Send Request to Applicant
                    </Button>
                  </Space>
                </div>
              </>
            ) : null}

            {activeAction === "MARK_READY" ? (
              <>
                <div className="flex flex-col gap-4">
                  <Alert
                    type="warning"
                    showIcon
                    message="Marking for Decision"
                    description="This will transition the application to the 'Ready for Decision' state, notifying the approvers that the review is complete."
                    className="bg-secondary/10! border-secondary/30!"
                  />

                  <div className="space-y-2">
                    <Typography.Text strong>
                      Review Completion Note
                    </Typography.Text>
                    <Input.TextArea
                      placeholder="Provide a summary of your review findings for the approver..."
                      rows={4}
                      value={readyNote}
                      onChange={(event) => setReadyNote(event.target.value)}
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Space size="middle">
                      <Button onClick={resetActionState}>Cancel</Button>
                      <Button
                        type="primary"
                        className="shadow-none!"
                        loading={isBusy}
                        onClick={() => {
                          if (!readyNote.trim()) {
                            feedback.error(
                              "Please add a completion note before marking ready.",
                            );
                            return;
                          }

                          void mutateWithFeedback(
                            () =>
                              markReady.mutateAsync({
                                id: actionApplication.id,
                                lock_version: actionApplication.lock_version,
                                notes: readyNote,
                              }),
                            "Application marked ready for decision.",
                          );
                        }}
                      >
                        Mark Ready for Decision
                      </Button>
                    </Space>
                  </div>
                </div>
              </>
            ) : null}

            {activeAction === "DECIDE" ? (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Typography.Text strong>Decision Reason</Typography.Text>
                    <Input.TextArea
                      placeholder="Enter the official reason for approval or rejection. This will be shared with the applicant."
                      rows={5}
                      value={decisionReason}
                      onChange={(e) => setDecisionReason(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Space size="middle">
                      <Button onClick={resetActionState}>Cancel</Button>
                      <Button
                        danger
                        loading={isBusy}
                        onClick={() => {
                          if (!decisionReason.trim()) {
                            feedback.error(
                              "Please provide a reason for rejection.",
                            );
                            return;
                          }
                          void mutateWithFeedback(
                            () =>
                              reject.mutateAsync({
                                id: actionApplication.id,
                                lock_version: actionApplication.lock_version,
                                decision_reason: decisionReason,
                              }),
                            "Application rejected.",
                          );
                        }}
                      >
                        Reject Application
                      </Button>
                      <Button
                        type="primary"
                        className="bg-green-600 hover:bg-green-500 border-green-600 shadow-none!"
                        loading={isBusy}
                        onClick={() => {
                          if (!decisionReason.trim()) {
                            feedback.error(
                              "Please provide a reason for approval.",
                            );
                            return;
                          }
                          void mutateWithFeedback(
                            () =>
                              approve.mutateAsync({
                                id: actionApplication.id,
                                lock_version: actionApplication.lock_version,
                                decision_reason: decisionReason,
                              }),
                            "Application approved successfully.",
                          );
                        }}
                      >
                        Approve Application
                      </Button>
                    </Space>
                  </div>
                </div>
              </>
            ) : null}
          </Space>
        ) : null}
      </Modal>

      <FileViewModal
        open={Boolean(viewingFile)}
        onClose={() => setViewingFile(null)}
        fileBlob={viewingFile?.blob ?? null}
        title={viewingFile?.title}
      />
    </Space>
  );
};

export default ReviewQueuePage;
