import { Alert, Button, Descriptions, Drawer, Space, Typography } from "antd";
import { Icon } from "@iconify/react";

import type { Application } from "@/features/applications/types/applications.types";
import { requiredDocumentTypes } from "@/features/applications/hooks/applications.constants";
import { StatusIndicator } from "@/components/status-indicator";

const { Paragraph, Text } = Typography;

type ReviewQueueDrawerProps = {
  open: boolean;
  selectedApplication: Application | undefined;
  userId: string | undefined;
  canReview: boolean;
  canDecide: boolean;
  canCurrentUserDecide: (application: Application) => boolean;
  isBusy: boolean;
  uploadedDocsMap: Map<string, string>;
  onClose: () => void;
  onStartReview: (application: Application) => void;
  onOpenRequestInformation: (application: Application) => void;
  onOpenMarkReady: (application: Application) => void;
  onOpenDecide: (application: Application) => void;
  onViewDocument: (versionId: string, documentType: string) => void;
};

export const ReviewQueueDrawer = ({
  open,
  selectedApplication,
  userId,
  canReview,
  canDecide,
  canCurrentUserDecide,
  isBusy,
  uploadedDocsMap,
  onClose,
  onStartReview,
  onOpenRequestInformation,
  onOpenMarkReady,
  onOpenDecide,
  onViewDocument,
}: ReviewQueueDrawerProps) => (
  <Drawer
    title="Application Details"
    width={620}
    open={open}
    onClose={onClose}
    footer={
      selectedApplication ? (
        <div className="flex justify-end py-2">
          {canReview &&
            (selectedApplication.current_state === "SUBMITTED" ||
              selectedApplication.current_state === "RESUBMITTED") && (
              <Button
                type="primary"
                loading={isBusy}
                onClick={() => onStartReview(selectedApplication)}
              >
                Start Review
              </Button>
            )}
          {canReview &&
            selectedApplication.current_state === "UNDER_REVIEW" && (
              <Space>
                <Button
                  onClick={() =>
                    onOpenRequestInformation(selectedApplication)
                  }
                >
                  Request Information
                </Button>
                <Button
                  type="primary"
                  onClick={() => onOpenMarkReady(selectedApplication)}
                >
                  Mark Ready for Decision
                </Button>
              </Space>
            )}
          {canCurrentUserDecide(selectedApplication) &&
            selectedApplication.current_state === "READY_FOR_DECISION" && (
              <Button
                type="primary"
                onClick={() => onOpenDecide(selectedApplication)}
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
        {canDecide &&
        selectedApplication.current_state === "READY_FOR_DECISION" &&
        selectedApplication.reviewed_by_id === userId ? (
          <Alert
            type="info"
            showIcon
            message="Decision restricted"
            description="You cannot approve or reject an application that you reviewed."
          />
        ) : null}
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
                <Text type="secondary">
                  Requested at:{" "}
                  {selectedApplication.latest_info_request?.requested_at
                    ? new Date(
                        selectedApplication.latest_info_request.requested_at,
                      ).toLocaleString()
                    : "N/A"}
                </Text>
                {selectedApplication.latest_info_request
                  ?.reviewer_summary_note ? (
                  <Text>
                    {
                      selectedApplication.latest_info_request
                        .reviewer_summary_note
                    }
                  </Text>
                ) : null}
                {(
                  selectedApplication.latest_info_request?.request_items ?? []
                ).map((item, index) => (
                  <Space
                    key={item.id}
                    direction="vertical"
                    size={0}
                    className="w-full"
                  >
                    <Text>
                      {index + 1}. {item.type.replaceAll("_", " ")}:{" "}
                      {item.instruction}
                    </Text>
                    {item.type === "OPEN_QUESTION" ? (
                      <Text type="secondary">
                        Applicant response:{" "}
                        {selectedApplication.latest_info_request?.applicant_responses
                          ?.find(
                            (response) =>
                              response.request_item_id === item.id,
                          )
                          ?.answer_text?.trim() || "No response submitted"}
                      </Text>
                    ) : null}
                    {(item.type === "DOCUMENT_REPLACEMENT" ||
                      item.type === "ADDITIONAL_DOCUMENT") &&
                    item.document_type ? (
                      <Text type="secondary">
                        Document update:{" "}
                        {uploadedDocsMap.has(item.document_type)
                          ? "Uploaded"
                          : "Not uploaded"}
                      </Text>
                    ) : null}
                  </Space>
                ))}
                <Text type="secondary">
                  Responded at:{" "}
                  {selectedApplication.latest_info_request?.responded_at
                    ? new Date(
                        selectedApplication.latest_info_request.responded_at,
                      ).toLocaleString()
                    : "N/A"}
                </Text>
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
          <Text strong>Documents Readiness</Text>
          {requiredDocumentTypes.map((type) => {
            const versionId = uploadedDocsMap.get(type);
            const missing = !versionId;
            return (
              <div
                key={type}
                className="p-2 bg-secondary/10 rounded-md flex items-center justify-between"
              >
                <Text strong={!missing}>{type.replaceAll("_", " ")}</Text>
                {missing ? (
                  <Text type="danger">(missing)</Text>
                ) : (
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      className="text-primary! hover:underline!"
                      onClick={() =>
                         onViewDocument(versionId, type)
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
);
