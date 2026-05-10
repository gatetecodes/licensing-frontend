import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  Upload,
} from "antd";
import type { FormInstance } from "antd/es/form";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

import PhoneInput from "@/components/form-inputs/phone";
import type { DocumentType } from "@/features/documents/types/documents.types";
import { useUploadDocumentMutation } from "@/features/documents/hooks/use-documents";
import { getAxiosApiErrorMessage } from "@/lib/api-error";
import { feedback } from "@/lib/feedback/feedback-bridge";
import type {
  Application,
  WorkflowFieldKey,
  WorkflowRequestItem,
  WorkflowResponseItem,
  InstitutionType,
  LicenseCategory,
} from "../types/applications.types";
import type { NewApplicationFormValues } from "./new-application";

const institutionOptions: InstitutionType[] = [
  "BANK",
  "MICROFINANCE",
  "INSURANCE",
  "LEASING",
  "OTHER",
];

const licenseCategoryOptions: Array<{ value: LicenseCategory; label: string }> =
  [
    { value: "COMMERCIAL_BANK", label: "Commercial Bank" },
    {
      value: "MICROFINANCE_DEPOSIT_TAKING",
      label: "Microfinance (Deposit Taking)",
    },
    {
      value: "MICROFINANCE_NON_DEPOSIT_TAKING",
      label: "Microfinance (Non-Deposit Taking)",
    },
    { value: "INSURANCE_LIFE", label: "Insurance (Life)" },
    { value: "INSURANCE_NON_LIFE", label: "Insurance (Non-Life)" },
    { value: "PAYMENT_SERVICE_PROVIDER", label: "Payment Service Provider" },
    { value: "LEASING_LICENSE", label: "Leasing License" },
    { value: "OTHER", label: "Other" },
  ];

const fieldLabels: Record<WorkflowFieldKey, string> = {
  institution_name: "Institution Name",
  institution_type: "Institution Type",
  business_address: "Business Address",
  contact_name: "Primary Contact Name",
  contact_email: "Primary Contact Email",
  contact_phone: "Primary Contact Phone",
  license_category: "License Category",
  license_category_other_details: "Other License Category Details",
  capital_amount_rwf: "Paid-up Capital (RWF)",
  incorporation_date: "Incorporation Date",
  business_summary: "Business Summary",
};

interface RespondToRequestProps {
  form: FormInstance<NewApplicationFormValues>;
  applicationId: string;
  application: Application;
  uploadedDocsMap: Map<string, string>;
  onViewDocument: (versionId: string, title: string) => void;
  onSaveUpdates: () => Promise<string | void> | string | void;
  onResubmit: (
    responses: WorkflowResponseItem[],
  ) => Promise<string | void> | string | void;
  onDocumentsChanged?: () => Promise<void> | void;
  isSubmitting?: boolean;
}

const RespondToRequest = ({
  form,
  applicationId,
  application,
  uploadedDocsMap,
  onViewDocument,
  onSaveUpdates,
  onResubmit,
  onDocumentsChanged,
  isSubmitting = false,
}: RespondToRequestProps) => {
  const uploadMutation = useUploadDocumentMutation();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const latestRequest = application.latest_info_request;

  const requestItems = useMemo<WorkflowRequestItem[]>(() => {
    const structuredItems = latestRequest?.request_items ?? [];
    if (structuredItems.length > 0) {
      return structuredItems;
    }

    if (latestRequest?.reviewer_summary_note?.trim()) {
      return [
        {
          id: "legacy-open-question",
          type: "OPEN_QUESTION",
          instruction: latestRequest.reviewer_summary_note,
          required: true,
        },
      ];
    }

    return [];
  }, [latestRequest]);

  const fieldItems = useMemo(
    () => requestItems.filter((item) => item.type === "FIELD_UPDATE" && item.field_key),
    [requestItems],
  );
  const openQuestionItems = useMemo(
    () => requestItems.filter((item) => item.type === "OPEN_QUESTION"),
    [requestItems],
  );
  const documentItems = useMemo(
    () =>
      requestItems.filter(
        (item) =>
          (item.type === "DOCUMENT_REPLACEMENT" ||
            item.type === "ADDITIONAL_DOCUMENT") &&
          item.document_type,
      ),
    [requestItems],
  );

  const existingAnswers = useMemo(
    () =>
      Object.fromEntries(
        (latestRequest?.applicant_responses ?? []).map((response) => [
          response.request_item_id,
          response.answer_text ?? "",
        ]),
      ) as Record<string, string>,
    [latestRequest?.applicant_responses],
  );

  const handleUpload = async (documentType: DocumentType, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      feedback.error("File must be 5 MB or less.");
      return false;
    }

    try {
      await uploadMutation.mutateAsync({
        applicationId,
        documentType,
        file,
      });
      feedback.success(`${documentType.replaceAll("_", " ")} uploaded.`);
      await onDocumentsChanged?.();
    } catch (error) {
      feedback.error(
        getAxiosApiErrorMessage(error, "Failed to upload document."),
      );
    }

    return false;
  };

  const collectResponses = (): WorkflowResponseItem[] =>
    openQuestionItems
      .map((item) => ({
        request_item_id: item.id,
        answer_text: (answers[item.id] ?? existingAnswers[item.id] ?? "").trim(),
      }))
      .filter((response) => Boolean(response.answer_text));

  const validateOpenQuestions = () => {
    for (const item of openQuestionItems) {
      if (
        item.required !== false &&
        !(answers[item.id] ?? existingAnswers[item.id] ?? "").trim()
      ) {
        feedback.error("Please answer all required questions before resubmitting.");
        return false;
      }
    }
    return true;
  };

  const fieldRequestByKey = useMemo(() => {
    const map = new Map<WorkflowFieldKey, WorkflowRequestItem>();
    fieldItems.forEach((item) => {
      if (!item.field_key) {
        return;
      }
      const existing = map.get(item.field_key);
      if (!existing || existing.required === false) {
        map.set(item.field_key, item);
      }
    });
    return map;
  }, [fieldItems]);

  const renderFieldControl = (fieldKey: WorkflowFieldKey, required: boolean) => {
    const rule = required
      ? [{ required: true, message: `${fieldLabels[fieldKey]} is required.` }]
      : [];

    if (fieldKey === "institution_name") {
      return (
        <Form.Item name="institution_name" label={fieldLabels[fieldKey]} rules={rule}>
          <Input placeholder="Institution name" size="large" />
        </Form.Item>
      );
    }

    if (fieldKey === "institution_type") {
      return (
        <Form.Item name="institution_type" label={fieldLabels[fieldKey]} rules={rule}>
          <Select
            size="large"
            placeholder="Select institution type"
            options={institutionOptions.map((value) => ({ value, label: value }))}
          />
        </Form.Item>
      );
    }

    if (fieldKey === "business_address") {
      return (
        <Form.Item name="business_address" label={fieldLabels[fieldKey]} rules={rule}>
          <Input placeholder="Registered office address" size="large" />
        </Form.Item>
      );
    }

    if (fieldKey === "contact_name") {
      return (
        <Form.Item name="contact_name" label={fieldLabels[fieldKey]} rules={rule}>
          <Input placeholder="Primary contact full name" size="large" />
        </Form.Item>
      );
    }

    if (fieldKey === "contact_email") {
      return (
        <Form.Item
          name="contact_email"
          label={fieldLabels[fieldKey]}
          rules={[
            ...rule,
            { type: "email", message: "Enter a valid email address." },
          ]}
        >
          <Input placeholder="contact@institution.com" size="large" />
        </Form.Item>
      );
    }

    if (fieldKey === "contact_phone") {
      return (
        <Form.Item name="contact_phone" label={fieldLabels[fieldKey]} rules={rule}>
          <PhoneInput placeholder="+2507..." />
        </Form.Item>
      );
    }

    if (fieldKey === "license_category") {
      return (
        <Form.Item name="license_category" label={fieldLabels[fieldKey]} rules={rule}>
          <Select
            size="large"
            placeholder="Select license category"
            options={licenseCategoryOptions}
          />
        </Form.Item>
      );
    }

    if (fieldKey === "license_category_other_details") {
      return (
        <Form.Item
          name="license_category_other_details"
          label={fieldLabels[fieldKey]}
          rules={rule}
        >
          <Input placeholder="Describe the requested license category" size="large" />
        </Form.Item>
      );
    }

    if (fieldKey === "incorporation_date") {
      return (
        <Form.Item
          name="incorporation_date"
          label={fieldLabels[fieldKey]}
          rules={rule}
          getValueFromEvent={(_, dateString: string) => dateString}
          getValueProps={(value: string | undefined) => ({
            value: value ? dayjs(value, "YYYY-MM-DD") : undefined,
          })}
        >
          <DatePicker
            className="w-full"
            size="large"
            format="YYYY-MM-DD"
            placeholder="Select incorporation date"
          />
        </Form.Item>
      );
    }

    if (fieldKey === "capital_amount_rwf") {
      return (
        <Form.Item
          name="capital_amount_rwf"
          label={fieldLabels[fieldKey]}
          rules={rule}
        >
          <InputNumber
            className="w-full"
            min={0 as number}
            placeholder="0.00"
            size="large"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) =>
              value?.replace(/\$\s?|(,*)/g, "") as unknown as number
            }
          />
        </Form.Item>
      );
    }

    return (
      <Form.Item name="business_summary" label={fieldLabels.business_summary} rules={rule}>
        <Input.TextArea
          rows={4}
          placeholder="Summarize business model, governance, and market focus."
        />
      </Form.Item>
    );
  };

  return (
    <Space direction="vertical" className="w-full py-2" size={16}>
      <Alert
        type="warning"
        showIcon
        message="Information Requested By Reviewer"
        description={
          <Space direction="vertical" size={4}>
            <Typography.Text type="secondary">
              Requested at: {latestRequest?.requested_at ? new Date(latestRequest.requested_at).toLocaleString() : "N/A"}
            </Typography.Text>
            {latestRequest?.reviewer_summary_note ? (
              <Typography.Text>{latestRequest.reviewer_summary_note}</Typography.Text>
            ) : null}
            <Typography.Text type="secondary">
              Respond to the exact requested items below, then resubmit.
            </Typography.Text>
          </Space>
        }
      />

      {fieldItems.length > 0 ? (
        <Space direction="vertical" className="w-full">
          <Typography.Text strong>Requested Field Updates</Typography.Text>
          {Array.from(fieldRequestByKey.entries()).map(([fieldKey, item]) => (
            <div key={item.id} className="rounded-md border border-[#f0f0f0] p-3 bg-white">
              <Typography.Text type="secondary" className="block mb-2">
                {item.instruction}
              </Typography.Text>
              <Form form={form} layout="vertical">
                {renderFieldControl(fieldKey, item.required !== false)}
              </Form>
            </div>
          ))}
        </Space>
      ) : null}

      {documentItems.length > 0 ? (
        <Space direction="vertical" className="w-full">
          <Typography.Text strong>Requested Document Updates</Typography.Text>
          {documentItems.map((item) => {
            const documentType = item.document_type as DocumentType;
            const versionId = uploadedDocsMap.get(documentType);
            const actionLabel =
              item.type === "DOCUMENT_REPLACEMENT" ? "Replace" : "Upload";

            return (
              <div
                key={item.id}
                className="p-3 bg-secondary/10 rounded-md flex flex-col gap-2"
              >
                <Typography.Text strong>
                  {(item.document_type ?? "DOCUMENT").replaceAll("_", " ")}
                </Typography.Text>
                <Typography.Text type="secondary">{item.instruction}</Typography.Text>
                <Space>
                  {versionId ? (
                    <Button
                      type="link"
                      size="small"
                      className="text-primary! hover:underline!"
                      onClick={() => onViewDocument(versionId, item.document_type ?? "Document")}
                    >
                      View current
                    </Button>
                  ) : null}
                  <Upload
                    accept="application/pdf"
                    showUploadList={false}
                    beforeUpload={(file) => handleUpload(documentType, file)}
                    disabled={uploadMutation.isPending}
                  >
                    <Button size="small">{actionLabel}</Button>
                  </Upload>
                  {versionId ? (
                    <Icon icon="lucide:check-circle" color="#52c41a" width="18" />
                  ) : null}
                </Space>
              </div>
            );
          })}
        </Space>
      ) : null}

      {openQuestionItems.length > 0 ? (
        <Space direction="vertical" className="w-full">
          <Typography.Text strong>Open Questions</Typography.Text>
          <Form layout="vertical">
            {openQuestionItems.map((item, index) => (
              <Form.Item
                key={item.id}
                label={`${index + 1}. ${item.instruction}`}
                required={item.required !== false}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Type your response"
                  value={answers[item.id] ?? existingAnswers[item.id] ?? ""}
                  onChange={(event) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [item.id]: event.target.value,
                    }))
                  }
                />
              </Form.Item>
            ))}
          </Form>
        </Space>
      ) : null}

      <Space className="w-full justify-end">
        <Button loading={isSubmitting} onClick={() => void onSaveUpdates()}>
          Save Updates
        </Button>
        <Button
          type="primary"
          className="shadow-none!"
          loading={isSubmitting}
          onClick={() => {
            if (!validateOpenQuestions()) {
              return;
            }
            void onResubmit(collectResponses());
          }}
        >
          Resubmit Application
        </Button>
      </Space>
    </Space>
  );
};

export default RespondToRequest;
