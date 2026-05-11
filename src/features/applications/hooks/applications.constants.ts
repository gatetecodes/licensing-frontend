import type { DocumentType } from "@/features/documents/types/documents.types";
import type { ApplicationState } from "../types/applications.types";

export const requiredDocumentTypes: DocumentType[] = [
  "BUSINESS_PLAN",
  "CERTIFICATE_OF_INCORPORATION",
  "SHAREHOLDING_STRUCTURE",
  "CAPITAL_ADEQUACY_EVIDENCE",
  "GOVERNANCE_DOCUMENT"
];

export const applicationStates: ApplicationState[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "INFO_REQUESTED",
  "RESUBMITTED",
  "READY_FOR_DECISION",
  "APPROVED",
  "REJECTED"
];
