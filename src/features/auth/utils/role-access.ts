import type { AuthUser, RoleName } from "../types/auth.types";
import {
  isAdmin,
  isApplicant,
  isApprover,
  isInternalViewer,
  isReviewer,
  isSuperAdmin,
} from "./role.utils";

export type ProtectedRoutePath =
  | "/dashboard"
  | "/applications"
  | "/review-queue"
  | "/documents"
  | "/audit-log"
  | "/admin/users"
  | "/settings";

export const getDefaultAuthenticatedRoute = (
  user: AuthUser | null | undefined,
): ProtectedRoutePath => {
  if (isApplicant(user)) {
    return "/applications";
  }
  if (isReviewer(user) || isApprover(user)) {
    return "/review-queue";
  }
  if (isAdmin(user) || isSuperAdmin(user)) {
    return "/dashboard";
  }
  return "/dashboard";
};

export const canAccessProtectedRoute = (
  user: AuthUser | null | undefined,
  route: ProtectedRoutePath,
): boolean => {
  switch (route) {
    case "/dashboard":
    case "/documents":
    case "/settings":
      return !!user;
    case "/applications":
      return isApplicant(user);
    case "/review-queue":
      return isInternalViewer(user);
    case "/audit-log":
      return isInternalViewer(user);
    case "/admin/users":
      return isAdmin(user) || isSuperAdmin(user);
    default:
      return false;
  }
};

export const getDashboardTitleForRole = (
  role: RoleName | null | undefined,
): string => {
  switch (role) {
    case "APPLICANT":
      return "My Dashboard";
    case "REVIEWER":
      return "Review Dashboard";
    case "APPROVER":
      return "Decision Dashboard";
    case "ADMIN":
    case "SUPER_ADMIN":
      return "Operations Dashboard";
    default:
      return "Dashboard";
  }
};
