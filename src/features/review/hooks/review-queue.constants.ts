import type {
  WorkflowFieldKey,
  WorkflowRequestItemType,
} from "@/features/applications/types/applications.types";
import type { DocumentType } from "@/features/documents/types/documents.types";

export type RequestDraftRow = {
  id: string;
  type: WorkflowRequestItemType;
  instruction: string;
  field_key?: WorkflowFieldKey;
  document_type?: DocumentType;
  required: boolean;
};

export const createRequestDraftRow = (): RequestDraftRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  type: "OPEN_QUESTION",
  instruction: "",
  required: true,
});

export const requestTypeOptions: Array<{
  value: WorkflowRequestItemType;
  label: string;
}> = [
  { value: "FIELD_UPDATE", label: "Field Update" },
  { value: "DOCUMENT_REPLACEMENT", label: "Document Replacement" },
  { value: "ADDITIONAL_DOCUMENT", label: "Additional Document" },
  { value: "OPEN_QUESTION", label: "Open Question" },
];

export const fieldKeyOptions: Array<{ value: WorkflowFieldKey; label: string }> =
  [
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
