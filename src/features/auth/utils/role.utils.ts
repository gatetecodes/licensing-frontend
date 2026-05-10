import type { AuthUser, RoleName } from "../types/auth.types";

export const hasRole = (user: AuthUser | null | undefined, role: RoleName) =>
  user?.role?.name === role;

export const isApplicant = (user: AuthUser | null | undefined) =>
  hasRole(user, "APPLICANT");

export const isReviewer = (user: AuthUser | null | undefined) =>
  hasRole(user, "REVIEWER");

export const isApprover = (user: AuthUser | null | undefined) =>
  hasRole(user, "APPROVER");

export const isAdmin = (user: AuthUser | null | undefined) =>
  hasRole(user, "ADMIN");

export const isSuperAdmin = (user: AuthUser | null | undefined) =>
  hasRole(user, "SUPER_ADMIN");

export const isInternalViewer = (user: AuthUser | null | undefined) =>
  isReviewer(user) || isApprover(user) || isAdmin(user) || isSuperAdmin(user);
