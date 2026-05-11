import type { Dispatch, SetStateAction } from "react";
import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  Select,
  Space,
  Typography,
} from "antd";
import { Icon } from "@iconify/react";

import { requiredDocumentTypes } from "@/features/applications/hooks/applications.constants";
import type { Application } from "@/features/applications/types/applications.types";
import type { ReviewQueueActiveAction } from "../hooks/use-review-queue-page";
import {
  createRequestDraftRow,
  fieldKeyOptions,
  requestTypeOptions,
  type RequestDraftRow,
} from "../hooks/review-queue.constants";

const { Title, Paragraph, Text } = Typography;

type ReviewQueueActionModalProps = {
  open: boolean;
  actionApplication: Application | null;
  activeAction: ReviewQueueActiveAction;
  requestRows: RequestDraftRow[];
  setRequestRows: Dispatch<SetStateAction<RequestDraftRow[]>>;
  reviewerSummaryNote: string;
  setReviewerSummaryNote: (value: string) => void;
  readyNote: string;
  setReadyNote: (value: string) => void;
  decisionReason: string;
  setDecisionReason: (value: string) => void;
  isBusy: boolean;
  onCancel: () => void;
  onSubmitRequestInformation: () => void;
  onSubmitMarkReady: () => void;
  onSubmitApprove: () => void;
  onSubmitReject: () => void;
};

export const ReviewQueueActionModal = ({
  open,
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
  isBusy,
  onCancel,
  onSubmitRequestInformation,
  onSubmitMarkReady,
  onSubmitApprove,
  onSubmitReject,
}: ReviewQueueActionModalProps) => (
  <Modal
    title={
      activeAction === "REQUEST_INFO"
        ? "Request Additional Information"
        : activeAction === "MARK_READY"
          ? "Mark Ready for Decision"
          : "Make Decision"
    }
    open={open}
    onCancel={onCancel}
    footer={null}
    width={activeAction === "REQUEST_INFO" ? 800 : 520}
    destroyOnClose
  >
    {actionApplication ? (
      <Space direction="vertical" className="w-full py-4" size={24}>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <Space direction="vertical" size={4}>
            <Text
              type="secondary"
              className="text-xs uppercase tracking-wider font-semibold"
            >
              Application Reference
            </Text>
            <Text strong className="text-lg">
              {actionApplication.reference_number} —{" "}
              {actionApplication.institution_name}
            </Text>
          </Space>
        </div>

        {activeAction === "REQUEST_INFO" ? (
          <>
            <div>
              <Title level={5}>Information Request Items</Title>
              <Paragraph type="secondary">
                Specify the exact fields or documents that require updates or
                clarification from the applicant.
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
                      <Text strong className="text-xs">
                        Request Type
                      </Text>
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
                        <Text strong className="text-xs">
                          Target Field
                        </Text>
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
                        <Text strong className="text-xs">
                          Target Document
                        </Text>
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
                    <Text strong className="text-xs">
                      Instructions for Applicant
                    </Text>
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
                setRequestRows((prev) => [...prev, createRequestDraftRow()])
              }
              className="h-10"
            >
              Add Another Request Item
            </Button>

            <div className="space-y-2">
              <Text strong>Reviewer Summary Note (Optional)</Text>
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
                <Button onClick={onCancel}>Cancel</Button>
                <Button
                  type="primary"
                  className="shadow-none!"
                  loading={isBusy}
                  icon={<Icon icon="lucide:send" />}
                  onClick={onSubmitRequestInformation}
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
                <Text strong>Review Completion Note</Text>
                <Input.TextArea
                  placeholder="Provide a summary of your review findings for the approver..."
                  rows={4}
                  value={readyNote}
                  onChange={(event) => setReadyNote(event.target.value)}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Space size="middle">
                  <Button onClick={onCancel}>Cancel</Button>
                  <Button
                    type="primary"
                    className="shadow-none!"
                    loading={isBusy}
                    onClick={onSubmitMarkReady}
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
                <Text strong>Decision Reason</Text>
                <Input.TextArea
                  placeholder="Enter the official reason for approval or rejection. This will be shared with the applicant."
                  rows={5}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Space size="middle">
                  <Button onClick={onCancel}>Cancel</Button>
                  <Button danger loading={isBusy} onClick={onSubmitReject}>
                    Reject Application
                  </Button>
                  <Button
                    type="primary"
                    className="bg-green-600 hover:bg-green-500 border-green-600 shadow-none!"
                    loading={isBusy}
                    onClick={onSubmitApprove}
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
);
