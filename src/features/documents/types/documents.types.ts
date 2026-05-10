export type DocumentType =
  | "BUSINESS_PLAN"
  | "CERTIFICATE_OF_INCORPORATION"
  | "SHAREHOLDING_STRUCTURE"
  | "CAPITAL_ADEQUACY_EVIDENCE"
  | "GOVERNANCE_DOCUMENT"
  | "SUPPORTING_DOCUMENT";

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  stored_filename: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  checksum: string;
  uploaded_by_id: string;
  uploaded_at: string;
  supersedes_version_id?: string;
}

export interface Document {
  id: string;
  application_id: string;
  document_type: DocumentType;
  created_at: string;
  latest_version?: DocumentVersion | null;
  versions_count?: number;
}

export interface DocumentListPayload {
  items: Document[];
}

export interface DocumentUploadPayload {
  document: Document;
}

export interface DocumentVersionListPayload {
  document: {
    id: string;
    application_id: string;
    document_type: DocumentType;
  };
  items: DocumentVersion[];
}
