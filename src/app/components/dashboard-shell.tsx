import { LogoutOutlined, SettingOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Layout, Typography } from "antd";
import { useMemo, type ReactNode } from "react";

import { useAuthSession } from "../../features/auth/hooks/use-auth";
import {
  getDashboardTitleForRole,
  type ProtectedRoutePath,
} from "../../features/auth/utils/role-access";
import {
  isApplicant,
  isInternalViewer,
} from "../../features/auth/utils/role.utils";
import LoadingIndicator from "@/components/loading-indicator";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardHeader from "./dashboard-header";
import DashboardFooter from "./dashboard-footer";

const routeTitleMap: Record<
  Exclude<ProtectedRoutePath, "/dashboard">,
  string
> = {
  "/applications": "Applications",
  "/review-queue": "Review Queue",
  "/documents": "Documents",
  "/audit-log": "Audit Trail",
  "/admin/users": "User Management",
  "/settings": "Settings",
};

interface DashboardShellProps {
  children: ReactNode;
  isLoggingOut: boolean;
  onLogout: () => Promise<void>;
}

const DashboardShell = ({
  children,
  isLoggingOut,
  onLogout,
}: DashboardShellProps) => {
  const { user } = useAuthSession();
  const navigate = useNavigate();
  const location = useLocation();

  const activePath = location.pathname;
  const roleName = user?.role?.name;
  const currentTitle =
    activePath === "/dashboard"
      ? getDashboardTitleForRole(roleName)
      : (routeTitleMap[activePath as keyof typeof routeTitleMap] ??
        "BNR Licensing Portal");
  const portalDescriptor = isApplicant(user)
    ? "Applicant Licensing Workspace"
    : isInternalViewer(user)
      ? "Regulatory Licensing Workspace"
      : "BNR Licensing Portal";

  const userMenuItems = useMemo(
    () => [
      {
        key: "user-info",
        label: (
          <div className="px-2 py-1.5 min-w-[180px]">
            <Typography.Text strong className="text-sm block">
              {user?.name}
            </Typography.Text>
            <Typography.Text type="secondary" className="text-xs block mt-0.5">
              {user?.role?.name}
            </Typography.Text>
          </div>
        ),
        disabled: true,
      },
      { type: "divider" as const },
      {
        key: "settings",
        icon: <SettingOutlined />,
        label: "Account Settings",
        onClick: () => navigate({ to: "/settings" as never }),
      },
      { type: "divider" as const },
      {
        key: "logout",
        danger: true,
        icon: <LogoutOutlined />,
        label: isLoggingOut ? "Logging out..." : "Logout",
        onClick: onLogout,
        disabled: isLoggingOut,
      },
    ],
    [user, navigate, onLogout, isLoggingOut],
  );

  return (
    <Layout className="dashboard-shell">
      {isLoggingOut ? <LoadingIndicator text="Logging out..." /> : null}
      <DashboardSidebar />
      <Layout>
        <DashboardHeader
          currentTitle={currentTitle}
          userMenuItems={userMenuItems}
        />

        <Layout.Content className="dashboard-content">
          <div className="dashboard-content-inner">{children}</div>
        </Layout.Content>

        <DashboardFooter
          portalDescriptor={portalDescriptor}
          activePath={activePath}
        />
      </Layout>
    </Layout>
  );
};

export default DashboardShell;
