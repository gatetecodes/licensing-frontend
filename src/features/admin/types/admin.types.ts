export type InternalRole = "REVIEWER" | "APPROVER" | "ADMIN" | "SUPER_ADMIN";
export type ManagedUserStatus = "ACTIVE" | "DISABLED";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  institution_name: string;
  status: ManagedUserStatus;
  email_verified_at?: string | null;
  roles: InternalRole[];
  created_at: string;
  updated_at: string;
}

export interface AdminUserListPayload {
  items: AdminUser[];
}

export interface AdminUserPayload {
  user: AdminUser;
}

export interface InviteInternalUserPayload {
  name: string;
  email: string;
  role: "REVIEWER" | "APPROVER" | "ADMIN";
}
