/* eslint-disable react-refresh/only-export-components */
import type { QueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Layout, Typography } from "antd";

import DashboardShell from "../components/dashboard-shell";
import UserManagementPage from "../../features/admin/pages/user-management-page";
import ApplicationsPage from "../../features/applications/pages/applications-page";
import AuditLogPage from "../../features/audit/pages/audit-log-page";
import DocumentsPage from "../../features/documents/pages/documents-page";
import {
  authMeQueryOptions,
  authQueryKeys,
  useAuthSession,
  useLogoutMutation,
} from "../../features/auth/hooks/use-auth";
import type { AuthUser } from "../../features/auth/types/auth.types";
import LoginPage from "../../features/auth/pages/login-page";
import RegisterPage from "../../features/auth/pages/register-page";
import SetPasswordPage from "../../features/auth/pages/set-password-page";
import VerifyEmailPage from "../../features/auth/pages/verify-email-page";
import {
  canAccessProtectedRoute,
  getDefaultAuthenticatedRoute,
  type ProtectedRoutePath,
} from "../../features/auth/utils/role-access";
import DashboardPage from "../../features/dashboard/pages/dashboard-page";
import ReviewQueuePage from "../../features/review/pages/review-queue-page";
import SettingsPage from "../../features/settings/pages/settings-page";
import { getAxiosApiErrorMessage, isAxiosApiError } from "../../lib/api-error";
import { queryClient } from "../providers/query-client";
import { feedback } from "@/lib/feedback/feedback-bridge";

export interface RouterContext {
  queryClient: QueryClient;
}

const getRouteForUser = (user: AuthUser | null | undefined) =>
  getDefaultAuthenticatedRoute(user);

const getAuthenticatedUser = async (
  context: RouterContext,
): Promise<AuthUser | null> => {
  const session = await context.queryClient.ensureQueryData(authMeQueryOptions());
  return session?.user ?? null;
};

const assertRouteAccess = (
  user: AuthUser | null | undefined,
  route: ProtectedRoutePath,
) => {
  if (!canAccessProtectedRoute(user, route)) {
    throw redirect({ to: getRouteForUser(user) });
  }
};

const RootLayout = () => (
  <Layout className="app-layout">
    <Layout.Content className="app-content">
      <Outlet />
    </Layout.Content>
  </Layout>
);

const NotFoundPage = () => (
  <div className="page-wrapper">
    <Typography.Title level={2}>Page Not Found</Typography.Title>
    <Typography.Paragraph type="secondary">
      The page you are looking for does not exist.
    </Typography.Paragraph>
    <Link to="/dashboard">Go to dashboard</Link>
  </div>
);

const PublicLayout = () => (
  <div className="w-full h-full">
    <Outlet />
  </div>
);

const ProtectedLayout = () => {
  const session = useAuthSession();
  const logoutMutation = useLogoutMutation();
  const navigate = useNavigate();

  useEffect(() => {
    if (session.isLoading) {
      return;
    }
    if (!session.isAuthenticated) {
      void navigate({ to: "/login" });
    }
  }, [session.isAuthenticated, session.isLoading, navigate]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      feedback.success("Logged out successfully");
      await navigate({ to: "/login" });
    } catch (error) {
      feedback.error(getAxiosApiErrorMessage(error, "Failed to logout"));
    }
  };

  return (
    <DashboardShell
      isLoggingOut={logoutMutation.isPending}
      onLogout={handleLogout}
    >
      <main className="dashboard-main">
        <Outlet />
      </main>
    </DashboardShell>
  );
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: async ({ context }) => {
    try {
      const user = await getAuthenticatedUser(context);
      if (user) {
        throw redirect({ to: getRouteForUser(user) });
      }
    } catch (error) {
      if (isAxiosApiError(error) && error.status === 401) {
        context.queryClient.setQueryData(authQueryKeys.me, null);
      } else {
        throw error;
      }
    }

    throw redirect({ to: "/login" });
  },
  component: () => null,
});

const publicRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "public",
  beforeLoad: async ({ context }) => {
    try {
      const user = await getAuthenticatedUser(context);
      if (user) {
        throw redirect({ to: getRouteForUser(user) });
      }
    } catch (error) {
      if (isAxiosApiError(error) && error.status === 401) {
        context.queryClient.setQueryData(authQueryKeys.me, null);
        return;
      }
      throw error;
    }
  },
  component: PublicLayout,
});

const loginRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: "login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: "register",
  component: RegisterPage,
});

const verifyEmailRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: "verify-email",
  component: VerifyEmailPage,
});

const verifyEmailTrailingSlashRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: "verify-email/",
  component: VerifyEmailPage,
});

const setPasswordRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: "set-password",
  component: SetPasswordPage,
});

const setPasswordTrailingSlashRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: "set-password/",
  component: SetPasswordPage,
});

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(authMeQueryOptions());
    } catch (error) {
      if (isAxiosApiError(error) && error.status === 401) {
        context.queryClient.setQueryData(authQueryKeys.me, null);
        throw redirect({ to: "/login" });
      }
      throw error;
    }
  },
  component: ProtectedLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "dashboard",
  component: DashboardPage,
});

const reviewQueueRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "review-queue",
  beforeLoad: async ({ context }) => {
    const user = await getAuthenticatedUser(context);
    assertRouteAccess(user, "/review-queue");
  },
  component: ReviewQueuePage,
});

const documentsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "documents",
  component: DocumentsPage,
});

const auditLogRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "audit-log",
  beforeLoad: async ({ context }) => {
    const user = await getAuthenticatedUser(context);
    assertRouteAccess(user, "/audit-log");
  },
  component: AuditLogPage,
});

const userManagementRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "admin/users",
  beforeLoad: async ({ context }) => {
    const user = await getAuthenticatedUser(context);
    assertRouteAccess(user, "/admin/users");
  },
  component: UserManagementPage,
});

const applicationsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "applications",
  beforeLoad: async ({ context }) => {
    const user = await getAuthenticatedUser(context);
    assertRouteAccess(user, "/applications");
  },
  component: ApplicationsPage,
});
const settingsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  publicRoute.addChildren([
    loginRoute,
    registerRoute,
    verifyEmailRoute,
    verifyEmailTrailingSlashRoute,
    setPasswordRoute,
    setPasswordTrailingSlashRoute,
  ]),
  protectedRoute.addChildren([
    dashboardRoute,
    applicationsRoute,
    reviewQueueRoute,
    documentsRoute,
    auditLogRoute,
    userManagementRoute,
    settingsRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  context: {
    queryClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
