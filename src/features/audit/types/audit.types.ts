export interface AuditLogEntry {
  id: number;
  application_id: string;
  acting_user_id: string;
  acting_user_name: string;
  action_type: string;
  occurred_at: string;
  before_state?: string;
  after_state?: string;
  request_id: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  previous_hash?: string;
  entry_hash: string;
  created_at: string;
}

export interface AuditLogListPayload {
  items: AuditLogEntry[];
}
