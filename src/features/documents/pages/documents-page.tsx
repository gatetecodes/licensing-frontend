import { MoreOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Drawer,
  Dropdown,
  Modal,
  Select,
  Space,
  Typography,
  Upload,
} from "antd";
import type { MenuProps, UploadProps } from "antd";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Table } from "@/components/table";
import { FileViewModal } from "@/components/file-view-modal";
import { useApplicationsList } from "@/features/applications/hooks/use-applications";
import { useAuthSession } from "@/features/auth/hooks/use-auth";
import { isApplicant } from "@/features/auth/utils/role.utils";
import { getAxiosApiErrorMessage } from "@/lib/api-error";
import { feedback } from "@/lib/feedback/feedback-bridge";
import {
  useDocumentVersions,
  useUploadDocumentMutation,
} from "../hooks/use-documents";
import { documentsService } from "../services/documents.service";
import type { DocumentType } from "../types/documents.types";
import { cn } from "@/lib/utils";

const { Title, Paragraph, Text } = Typography;

const documentTypes: DocumentType[] = [
  "BUSINESS_PLAN",
  "CERTIFICATE_OF_INCORPORATION",
  "SHAREHOLDING_STRUCTURE",
  "CAPITAL_ADEQUACY_EVIDENCE",
  "GOVERNANCE_DOCUMENT",
];

const triggerFileDownload = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};

const DocumentsPage = () => {
  const { user } = useAuthSession();
  const canUpload = isApplicant(user);
  const applicationsQuery = useApplicationsList({
    viewerId: user?.id,
    viewerRole: user?.role?.name,
    enabled: Boolean(user),
  });
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isVersionsDrawerOpen, setIsVersionsDrawerOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<DocumentType>();
  const [file, setFile] = useState<File | null>(null);
  const [viewingFile, setViewingFile] = useState<{
    blob: Blob;
    title: string;
  } | null>(null);
  const versionsQuery = useDocumentVersions(selectedDocumentId);
  const uploadMutation = useUploadDocumentMutation();

  const applicationMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of applicationsQuery.data?.items ?? []) {
      map.set(item.id, `${item.reference_number} - ${item.institution_name}`);
    }
    return map;
  }, [applicationsQuery.data?.items]);

  const applicationIdsToFetch = useMemo(
    () =>
      selectedApplicationId
        ? [selectedApplicationId]
        : (applicationsQuery.data?.items ?? []).map((item) => item.id),
    [applicationsQuery.data?.items, selectedApplicationId],
  );

  const docsQuery = useQuery({
    queryKey: ["documents", "list", ...applicationIdsToFetch],
    enabled: applicationIdsToFetch.length > 0,
    queryFn: async () => {
      const payloads = await Promise.all(
        applicationIdsToFetch.map((applicationId) =>
          documentsService.listByApplication(applicationId),
        ),
      );
      return {
        items: payloads
          .flatMap((payload) => payload.items)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          ),
      };
    },
  });

  const uploadProps: UploadProps = {
    maxCount: 1,
    accept: "application/pdf",
    beforeUpload: () => false,
    onChange: ({ file: nextFile }) => {
      const selectedFile = nextFile.originFileObj ?? nextFile;
      if (selectedFile instanceof File) {
        setFile(selectedFile);
      }
    },
    onRemove: () => setFile(null),
    fileList: file
      ? [
          {
            uid: (file as File & { uid?: string }).uid ?? file.name,
            name: file.name,
            status: "done",
          },
        ]
      : [],
  };

  const handleUpload = async () => {
    if (!selectedApplicationId || !selectedDocumentType || !file) {
      feedback.warning("Select application, document type, and PDF file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      feedback.error("File must be 5 MB or less.");
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        applicationId: selectedApplicationId,
        documentType: selectedDocumentType,
        file,
      });
      feedback.success("Document uploaded successfully.");
      setFile(null);
      setSelectedDocumentType(undefined);
      setIsUploadModalOpen(false);
      await docsQuery.refetch();
    } catch (error) {
      feedback.error(
        getAxiosApiErrorMessage(error, "Failed to upload document."),
      );
    }
  };

  const handleDownload = async (versionId: string) => {
    try {
      const { blob, filename } =
        await documentsService.downloadVersion(versionId);
      triggerFileDownload(blob, filename);
    } catch (error) {
      feedback.error(
        getAxiosApiErrorMessage(error, "Failed to download document."),
      );
    }
  };

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

  return (
    <Space direction="vertical" size={16} className="w-full">
      <div>
        <Title level={2}>Documents</Title>
        {canUpload ? (
          <>
            <Paragraph type="secondary">
              Upload PDF documents, inspect version history, and download prior versions.
            </Paragraph>
            <Text type="secondary">
              Allowed file type: PDF. Maximum size: 5 MB.
            </Text>
          </>
        ) : (
          <Paragraph type="secondary">
            Inspect document version history and download prior versions submitted by applicants.
          </Paragraph>
        )}
      </div>
      <Card
        bordered={false}
        title="Documents"
        extra={
          <Space>
            <Select
              placeholder="Select application"
              allowClear
              style={{ minWidth: 320 }}
              value={selectedApplicationId}
              onChange={(value) => {
                setSelectedApplicationId(value);
                setSelectedDocumentId(undefined);
              }}
              options={(applicationsQuery.data?.items ?? []).map((item) => ({
                value: item.id,
                label: `${item.reference_number} - ${item.institution_name}`,
              }))}
            />
            {canUpload ? (
              <Button
                type="primary"
                disabled={!selectedApplicationId}
                onClick={() => setIsUploadModalOpen(true)}
              >
                Upload Document
              </Button>
            ) : null}
          </Space>
        }
      >
        <Table
          isPlainTable
          rowKey="id"
          loading={applicationsQuery.isLoading || docsQuery.isLoading}
          dataSource={docsQuery.data?.items ?? []}
          columns={[
            {
              title: "Application",
              render: (_, record) => {
                const text =
                  applicationMap.get(record.application_id) ??
                  record.application_id;
                return (
                  <div className="truncate max-w-[200px]" title={text}>
                    {text}
                  </div>
                );
              },
              width: 200,
            },
            {
              title: "Type",
              dataIndex: "document_type",
              render: (value: DocumentType) => (
                <div className={cn("", {
                  "text-primary": value === "BUSINESS_PLAN",
                  "text-secondary": value === "CERTIFICATE_OF_INCORPORATION",
                  "text-success": value === "SHAREHOLDING_STRUCTURE",
                  "text-warning": value === "CAPITAL_ADEQUACY_EVIDENCE",
                  "text-blue-500": value === "GOVERNANCE_DOCUMENT",
                })} title={value}>
                  {value.replaceAll("_", " ")}
                </div>
              ),
            },
            {
              title: "Latest Version",
              dataIndex: ["latest_version", "version_number"],
            },
            {
              title: "File",
              dataIndex: ["latest_version", "original_filename"],
              width: 200,
              render: (value: string) => (
                <div className="truncate max-w-[200px]" title={value}>
                  {value}
                </div>
              ),
            },
            {
              title: "Actions",
              render: (_, record) => {
                const items: MenuProps["items"] = [
                  {
                    key: "versions",
                    label: "View Versions",
                    onClick: () => {
                      setSelectedDocumentId(record.id);
                      setIsVersionsDrawerOpen(true);
                    },
                  },
                  ...(record.latest_version
                    ? [
                        {
                          key: "view-latest",
                          label: "View Latest",
                          onClick: () =>
                             handleViewDocument(
                              record.latest_version!.id,
                              record.document_type,
                            ),
                        },
                        {
                          key: "download-latest",
                          label: "Download Latest",
                          onClick: () =>
                             handleDownload(record.latest_version!.id),
                        },
                      ]
                    : []),
                ];
                return (
                  <Dropdown menu={{ items }} trigger={["click"]}>
                    <Button
                      icon={<MoreOutlined />}
                      aria-label="Document actions"
                    />
                  </Dropdown>
                );
              },
            },
          ]}
        />
      </Card>

      <Drawer
        title="Document Versions"
        width={720}
        open={isVersionsDrawerOpen}
        onClose={() => setIsVersionsDrawerOpen(false)}
      >
        <Table
          isPlainTable
          rowKey="id"
          loading={versionsQuery.isLoading}
          dataSource={versionsQuery.data?.items ?? []}
          columns={[
            { title: "Version", dataIndex: "version_number" },
            { title: "Filename", dataIndex: "original_filename" },
            { title: "Uploaded At", dataIndex: "uploaded_at" },
            {
              title: "Download",
              render: (_, record) => (
                <Space>
                  <Button
                    type="link"
                    className="text-primary! hover:underline!"
                    onClick={() =>
                       handleViewDocument(record.id, record.original_filename)
                    }
                  >
                    View
                  </Button>
                  <Button
                    type="link"
                    className="text-primary! hover:underline!"
                    onClick={() =>  handleDownload(record.id)}
                  >
                    Download
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Drawer>

      <Modal
        title="Upload Document"
        open={isUploadModalOpen}
        onCancel={() => setIsUploadModalOpen(false)}
        onOk={() =>  handleUpload()}
        okText="Upload"
        confirmLoading={uploadMutation.isPending}
      >
        <Space direction="vertical" className="w-full">
          <Select
            placeholder="Select document type"
            value={selectedDocumentType}
            onChange={(value) => setSelectedDocumentType(value)}
            options={documentTypes.map((type) => ({
              value: type,
              label: type,
            }))}
          />
          <Upload {...uploadProps}>
            <Button>Select PDF</Button>
          </Upload>
          <Typography.Text type="secondary">
            Allowed file type: PDF. Maximum size: 5 MB.
          </Typography.Text>
        </Space>
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

export default DocumentsPage;
