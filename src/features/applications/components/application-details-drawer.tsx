import { Alert, Button, Descriptions, Drawer, Space, Typography } from "antd";
import { Icon } from "@iconify/react";

import { StatusIndicator } from "@/components/status-indicator";
import type { DocumentType } from "@/features/documents/types/documents.types";
import type { Application } from "../types/applications.types";

type ApplicationDetailsDrawerProps = {
  open: boolean;
  selectedApplication?: Application;
  canManageDrafts: boolean;
  busy: boolean;
  uploadedDocsMap: Map<string, string>;
  requiredDocumentTypes: DocumentType[];
  missingRequiredDocuments: DocumentType[];
  onClose: () => void;
  onViewDocument: (versionId: string, type: string) => void;
  onOpenUpdateModal: (application: Application) => void;
  onSubmitApplication: (application: Application) => Promise<string>;
};

const ApplicationDetailsDrawer = ({
  open,
  selectedApplication,
  canManageDrafts,
  busy,
  uploadedDocsMap,
  requiredDocumentTypes,
  missingRequiredDocuments,
  onClose,
  onViewDocument,
  onOpenUpdateModal,
  onSubmitApplication
}: ApplicationDetailsDrawerProps) => (
  <Drawer title="Application Details" width={620} open={open} onClose={onClose}>
    {selectedApplication ? (
      <Space direction="vertical" className="w-full">
        <StatusIndicator status={selectedApplication.current_state} />
        {canManageDrafts && selectedApplication.current_state === "INFO_REQUESTED" ? (
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
                        selectedApplication.latest_info_request.requested_at
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
                  )
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
        {canManageDrafts && selectedApplication.current_state === "DRAFT" ? (
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
                    <Typography.Text type="danger">(missing)</Typography.Text>
                  ) : (
                    <Space>
                      <Button
                        type="link"
                        size="small"
                        className="text-primary! hover:underline!"
                        onClick={() => onViewDocument(versionId, type)}
                      >
                        View
                      </Button>
                      <Icon icon="lucide:check-circle" color="#52c41a" width="18" />
                    </Space>
                  )}
                </div>
              );
            })}
          </Space>
        ) : null}
        {canManageDrafts && selectedApplication.current_state === "DRAFT" ? (
          <Space>
            <Button
              loading={busy}
              onClick={() => onOpenUpdateModal(selectedApplication)}
            >
              Update Draft
            </Button>
            <Button
              type="primary"
              disabled={missingRequiredDocuments.length > 0}
              loading={busy}
              onClick={() =>  onSubmitApplication(selectedApplication)}
            >
              Submit Application
            </Button>
          </Space>
        ) : null}
        {canManageDrafts && selectedApplication.current_state === "INFO_REQUESTED" ? (
          <Space>
            <Button
              loading={busy}
              onClick={() => onOpenUpdateModal(selectedApplication)}
            >
              Respond To Request
            </Button>
          </Space>
        ) : null}
      </Space>
    ) : (
      <Typography.Paragraph type="secondary">
        Select an application to view details.
      </Typography.Paragraph>
    )}
  </Drawer>
);

export default ApplicationDetailsDrawer;
