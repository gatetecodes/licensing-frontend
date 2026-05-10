import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Steps,
  Typography,
  Upload,
} from "antd";
import { Icon } from "@iconify/react";
import type { FormInstance } from "antd/es/form";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

import PhoneInput from "@/components/form-inputs/phone";
import { getAxiosApiErrorMessage } from "@/lib/api-error";
import { feedback } from "@/lib/feedback/feedback-bridge";
import { useUploadDocumentMutation } from "@/features/documents/hooks/use-documents";
import type {
  InstitutionType,
  LicenseCategory,
} from "../types/applications.types";
import type { DocumentType } from "@/features/documents/types/documents.types";

const institutionOptions: InstitutionType[] = [
  "BANK",
  "MICROFINANCE",
  "INSURANCE",
  "LEASING",
  "OTHER",
];

type NewApplicationFormValues = {
  institution_name: string;
  institution_type: InstitutionType;
  business_address: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  license_category: LicenseCategory;
  license_category_other_details: string;
  capital_amount_rwf: number;
  incorporation_date: string;
  business_summary: string;
};

interface NewApplicationProps {
  form: FormInstance<NewApplicationFormValues>;
  applicationId?: string;
  missingRequiredDocuments?: DocumentType[];
  uploadedDocsMap?: Map<string, string>;
  onViewDocument?: (versionId: string, type: string) => void;
  onSubmit: () => Promise<string | void> | string | void;
  onFinalSubmit?: () => Promise<string | void> | string | void;
  finalSubmitLabel?: string;
  onStepSave?: () => Promise<string | void> | string | void;
  isSubmitting?: boolean;
}

const requiredDocumentTypes: DocumentType[] = [
  "BUSINESS_PLAN",
  "CERTIFICATE_OF_INCORPORATION",
  "SHAREHOLDING_STRUCTURE",
  "CAPITAL_ADEQUACY_EVIDENCE",
  "GOVERNANCE_DOCUMENT",
];

const stepFieldNames: Array<Array<keyof NewApplicationFormValues>> = [
  ["institution_name", "institution_type", "business_address"],
  ["contact_name", "contact_email", "contact_phone"],
  [
    "license_category",
    "license_category_other_details",
    "capital_amount_rwf",
    "incorporation_date",
    "business_summary",
  ],
  [],
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

const NewApplication = ({
  form,
  applicationId,
  missingRequiredDocuments,
  uploadedDocsMap,
  onViewDocument,
  onSubmit,
  onFinalSubmit,
  finalSubmitLabel,
  onStepSave,
  isSubmitting = false,
}: NewApplicationProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const uploadMutation = useUploadDocumentMutation();

  const effectiveMissingDocs = useMemo(
    () => missingRequiredDocuments ?? requiredDocumentTypes,
    [missingRequiredDocuments],
  );

  const handleNext = async () => {
    setIsNextLoading(true);
    try {
      const names = stepFieldNames[currentStep];
      if (names.length > 0) {
        await form.validateFields(names);
      }
      if (onStepSave) {
        const saveMessage = await onStepSave();
        setSuccessFeedback(saveMessage ?? "Draft saved");
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSuccessFeedback(null);
      }
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    } finally {
      setIsNextLoading(false);
    }
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleUpload = async (documentType: DocumentType, file: File) => {
    if (!applicationId) return false;
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
      feedback.success("Document uploaded successfully.");
    } catch (error) {
      feedback.error(getAxiosApiErrorMessage(error, "Failed to upload document."));
    }
    return false;
  };

  return (
    <div className="mt-5">
      <p className="text-gray-400 mb-4">
        Complete your application. A draft will be saved automatically after
        each step.
      </p>
      <Steps
        current={currentStep}
        size="small"
        items={[
          { title: "Profile" },
          { title: "Contact" },
          { title: "Licensing" },
          { title: "Documents Readiness" },
        ]}
        className="mt-5! mb-10!"
      />
      <Form
        layout="vertical"
        form={form}
        initialValues={{
          institution_name: "",
          business_address: "",
          contact_name: "",
          contact_email: "",
          contact_phone: "",
          license_category: "COMMERCIAL_BANK",
          license_category_other_details: "",
          capital_amount_rwf: undefined,
          incorporation_date: "",
          business_summary: "",
        }}
      >
        <div style={{ display: currentStep === 0 ? "block" : "none" }}>
          <Form.Item
            name="institution_name"
            label="Institution Name"
            rules={[
              { required: true, message: "Institution name is required." },
            ]}
          >
            <Input placeholder="Institution name" size="large" />
          </Form.Item>
          <Form.Item
            name="institution_type"
            label="Institution Type"
            rules={[
              { required: true, message: "Institution type is required." },
            ]}
          >
            <Select
              size="large"
              placeholder="Select institution type"
              options={institutionOptions.map((value) => ({
                value,
                label: value,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="business_address"
            label="Business Address"
            rules={[
              { required: true, message: "Business address is required." },
            ]}
          >
            <Input placeholder="Registered office address" size="large" />
          </Form.Item>
        </div>

        <div style={{ display: currentStep === 1 ? "block" : "none" }}>
          <Form.Item
            name="contact_name"
            label="Primary Contact Name"
            rules={[{ required: true, message: "Contact name is required." }]}
          >
            <Input placeholder="Primary contact full name" size="large" />
          </Form.Item>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="contact_email"
              label="Primary Contact Email"
              rules={[
                { required: true, message: "Contact email is required." },
                { type: "email", message: "Enter a valid email address." },
              ]}
            >
              <Input placeholder="contact@institution.com" size="large" />
            </Form.Item>
            <Form.Item
              name="contact_phone"
              label="Primary Contact Phone"
              rules={[
                { required: true, message: "Contact phone is required." },
              ]}
            >
              <PhoneInput placeholder="+2507..." />
            </Form.Item>
          </div>
        </div>

        <div style={{ display: currentStep === 2 ? "block" : "none" }}>
          <Form.Item
            name="license_category"
            label="License Category"
            rules={[
              { required: true, message: "License category is required." },
            ]}
          >
            <Select
              size="large"
              placeholder="Select license category"
              options={licenseCategoryOptions}
            />
          </Form.Item>
          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) =>
              getFieldValue("license_category") === "OTHER" ? (
                <Form.Item
                  name="license_category_other_details"
                  label="Other License Category Details"
                  rules={[
                    {
                      required: true,
                      message: "Provide details when category is Other.",
                    },
                  ]}
                >
                  <Input
                    placeholder="Describe the requested license category"
                    size="large"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item
            name="incorporation_date"
            label="Incorporation Date"
            rules={[
              { required: true, message: "Incorporation date is required." },
            ]}
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
          <Form.Item
            name="capital_amount_rwf"
            label="Capital (RWF)"
            rules={[{ required: true, message: "Capital amount is required." }]}
          >
            <InputNumber
              className="w-full"
              style={{ width: "60%" }}
              min={0 as number}
              placeholder="0.00"
              size="large"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) =>
                value?.replace(/\$\s?|(,*)/g, "") as unknown as number
              }
            />
          </Form.Item>
          <Form.Item
            name="business_summary"
            label="Business Summary"
            rules={[
              { required: true, message: "Business summary is required." },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Summarize business model, governance, and market focus."
            />
          </Form.Item>
        </div>

        <div style={{ display: currentStep === 3 ? "block" : "none" }}>
          <Typography.Paragraph>
            Before final submit, all required document types must be uploaded.
          </Typography.Paragraph>
          <Space direction="vertical" className="w-full mb-4">
            {requiredDocumentTypes.map((type) => {
              const missing = effectiveMissingDocs.includes(type);
              return (
                <div key={type} className="p-3 bg-secondary/10 rounded-md flex items-center justify-between">
                  <Typography.Text strong={!missing}>{type.replaceAll("_", " ")}</Typography.Text>
                  {missing ? (
                    <Space>
                      <Typography.Text type="danger">(missing)</Typography.Text>
                      {applicationId ? (
                        <Upload
                          accept="application/pdf"
                          showUploadList={false}
                          beforeUpload={(file) => handleUpload(type, file)}
                          disabled={uploadMutation.isPending}
                        >
                          <Button size="small" type="default">Upload</Button>
                        </Upload>
                      ) : null}
                    </Space>
                  ) : (
                    <Space>
                      {uploadedDocsMap?.has(type) && onViewDocument ? (
                        <Button
                          type="link"
                          size="small"
                          className="text-primary! hover:underline!"
                          onClick={() => onViewDocument(uploadedDocsMap.get(type)!, type)}
                        >
                          View
                        </Button>
                      ) : null}
                      <Icon icon="lucide:check-circle" color="#52c41a" width="18" />
                    </Space>
                  )}
                </div>
              );
            })}
          </Space>
        </div>
      </Form>
      <Space className="w-full justify-end mt-2">
        <Button disabled={currentStep === 0 || isNextLoading || isSaveLoading} onClick={handleBack}>
          Back
        </Button>
        {currentStep < 3 ? (
          <Button
            type={successFeedback ? "default" : "primary"}
            className={successFeedback ? "border-green-500 text-green-600" : ""}
            loading={(isNextLoading || isSubmitting) && !successFeedback}
            onClick={() => void handleNext()}
          >
            {successFeedback ? (
              <span className="flex items-center gap-2">
                <Icon icon="lucide:check" /> {successFeedback}
              </span>
            ) : (
              "Next"
            )}
          </Button>
        ) : null}
        {currentStep === 3 ? (
          <Button
            type={successFeedback ? "default" : "primary"}
            className={successFeedback ? "border-green-500 text-green-600" : ""}
            loading={(isSaveLoading || isSubmitting) && !successFeedback}
            onClick={async () => {
              setIsSaveLoading(true);
              try {
                const isReadyToSubmit = effectiveMissingDocs.length === 0 && Boolean(onFinalSubmit);
                const saveMessage = isReadyToSubmit && onFinalSubmit
                  ? await onFinalSubmit()
                  : await onSubmit();
                setSuccessFeedback(saveMessage ?? (isReadyToSubmit ? "Submitted" : "Draft saved"));
                await new Promise((resolve) => setTimeout(resolve, 1500));
                setSuccessFeedback(null);
              } finally {
                setIsSaveLoading(false);
              }
            }}
          >
            {successFeedback ? (
              <span className="flex items-center gap-2">
                <Icon icon="lucide:check" /> {successFeedback}
              </span>
            ) : (
              effectiveMissingDocs.length === 0 && onFinalSubmit
                ? finalSubmitLabel ?? "Submit Application"
                : "Save Draft"
            )}
          </Button>
        ) : null}
      </Space>
    </div>
  );
};

export type { NewApplicationFormValues };
export default NewApplication;
