export type InstitutionType =
  | "BANK"
  | "MICROFINANCE"
  | "INSURANCE"
  | "LEASING"
  | "OTHER";

export type ApplicationState =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "INFO_REQUESTED"
  | "RESUBMITTED"
  | "READY_FOR_DECISION"
  | "APPROVED"
  | "REJECTED";

export type LicenseCategory =
  | "COMMERCIAL_BANK"
  | "MICROFINANCE_DEPOSIT_TAKING"
  | "MICROFINANCE_NON_DEPOSIT_TAKING"
  | "INSURANCE_LIFE"
  | "INSURANCE_NON_LIFE"
  | "PAYMENT_SERVICE_PROVIDER"
  | "LEASING_LICENSE"
  | "OTHER";

export type WorkflowRequestItemType =
  | "FIELD_UPDATE"
  | "DOCUMENT_REPLACEMENT"
  | "ADDITIONAL_DOCUMENT"
  | "OPEN_QUESTION";

export type WorkflowFieldKey =
  | "institution_name"
  | "institution_type"
  | "business_address"
  | "contact_name"
  | "contact_email"
  | "contact_phone"
  | "license_category"
  | "license_category_other_details"
  | "capital_amount_rwf"
  | "incorporation_date"
  | "business_summary";

export interface WorkflowRequestItem {
  id: string;
  type: WorkflowRequestItemType;
  instruction: string;
  field_key?: WorkflowFieldKey;
  document_type?: string;
  required: boolean;
}

export interface WorkflowResponseItem {
  request_item_id: string;
  answer_text?: string;
}

export interface LatestInfoRequest {
  reviewer_summary_note?: string | null;
  requested_at: string;
  request_items: WorkflowRequestItem[];
  applicant_responses?: WorkflowResponseItem[] | null;
  responded_at?: string | null;
}

export interface ApplicationReview {
  id: string;
  reviewer_id: string;
  cycle_number: number;
  outcome?: string;
  notes?: string | null;
  completed_at?: string | null;
  request_items?: WorkflowRequestItem[];
  applicant_responses?: WorkflowResponseItem[] | null;
  responded_at?: string | null;
}

export interface Application {
  id: string;
  reference_number: string;
  applicant_id: string;
  institution_name: string;
  institution_type: InstitutionType;
  business_address?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  license_category?: LicenseCategory;
  license_category_other_details?: string;
  capital_amount_rwf?: number;
  incorporation_date?: string;
  business_summary?: string;
  current_state: ApplicationState;
  submitted_at?: string;
  reviewed_by_id?: string;
  decisioned_by_id?: string;
  decision_at?: string;
  decision_reason?: string;
  latest_review?: ApplicationReview | null;
  latest_info_request?: LatestInfoRequest | null;
  lock_version: number;
  created_at: string;
  updated_at: string;
}

export interface ApplicationListPayload {
  items: Application[];
  count?: number;
}

export interface ApplicationDetailPayload {
  application: Application;
}

export interface CreateApplicationPayload {
  institution_name: string;
  institution_type: InstitutionType;
  business_address?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  license_category?: LicenseCategory;
  license_category_other_details?: string;
  capital_amount_rwf?: number;
  incorporation_date?: string;
  business_summary?: string;
}

export interface UpdateDraftPayload extends CreateApplicationPayload {
  id: string;
  lock_version: number;
}

export interface WorkflowActionPayload {
  id: string;
  lock_version: number;
}

export interface WorkflowResubmitPayload extends WorkflowActionPayload {
  responses: WorkflowResponseItem[];
}
