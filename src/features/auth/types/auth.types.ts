export type RoleName =
  | "APPLICANT"
  | "REVIEWER"
  | "APPROVER"
  | "ADMIN"
  | "SUPER_ADMIN";

export interface AuthRole {
  id: string;
  name: RoleName;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  institution_name?: string;
  role: AuthRole | null;
}

export interface CsrfTokenPayload {
  csrfToken: string;
}

export interface AuthSessionPayload extends CsrfTokenPayload {
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  institution_name: string;
  password: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface SetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordSetupRequestPayload {
  email: string;
}

export interface SessionState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
