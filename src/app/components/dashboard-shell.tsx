import {
  DownOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Avatar,
  Layout,
  Menu,
  Space,
  Typography,
  Grid,
  Dropdown,
} from "antd";
import { useMemo, type ReactNode } from "react";

import { useAuthSession } from "../../features/auth/hooks/use-auth";
import type { RoleName } from "../../features/auth/types/auth.types";
import {
  getDashboardTitleForRole,
  type ProtectedRoutePath,
} from "../../features/auth/utils/role-access";
import {
  isApplicant,
  isInternalViewer,
} from "../../features/auth/utils/role.utils";
import { Logo } from "../../components/logo";
import {Icon} from "@iconify/react";

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

type NavigationItem = {
  key: ProtectedRoutePath;
  label: string;
  icon: ReactNode;
  isVisible: (roleName: RoleName | undefined) => boolean;
};

const navigationItems: NavigationItem[] = [
  {
    key: "/dashboard",
    label: "Dashboard",
    icon: <Icon icon="solar:home-angle-bold-duotone" className="size-6" />,
    isVisible: () => true,
  },
  {
    key: "/applications",
    label: "Applications",
    icon: <Icon icon="solar:document-add-bold-duotone" className="size-6" />,
    isVisible: (roleName) => roleName === "APPLICANT",
  },
  {
    key: "/review-queue",
    label: "Review Queue",
    icon: (
      <Icon
        icon="solar:checklist-minimalistic-bold-duotone"
        className="size-6"
      />
    ),
    isVisible: (roleName) =>
      roleName === "REVIEWER" ||
      roleName === "APPROVER" ||
      roleName === "ADMIN" ||
      roleName === "SUPER_ADMIN",
  },
  {
    key: "/documents",
    label: "Documents",
    icon: <Icon icon="lets-icons:file-dock-duotone" className="size-6" />,
    isVisible: () => true,
  },
  {
    key: "/audit-log",
    label: "Audit Trail",
    icon: <Icon icon="lets-icons:chat-search-duotone" className="size-6" />,
    isVisible: (roleName) =>
      roleName === "REVIEWER" ||
      roleName === "APPROVER" ||
      roleName === "ADMIN" ||
      roleName === "SUPER_ADMIN",
  },
  {
    key: "/admin/users",
    label: "User Management",
    icon: <TeamOutlined />,
    isVisible: (roleName) => roleName === "ADMIN" || roleName === "SUPER_ADMIN",
  },
  {
    key: "/settings",
    label: "Settings",
    icon: <Icon icon="lets-icons:setting-line-duotone" className="size-6" />,
    isVisible: () => true,
  },
];

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
  const { lg } = Grid.useBreakpoint();
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

  const menuItems = useMemo(
    () =>
      navigationItems
        .filter((item) => item.isVisible(roleName))
        .map((item) => ({
          key: item.key,
          icon: item.icon,
          label: item.label,
        })),
    [roleName],
  );

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
      <Layout.Sider
        width={252}
        trigger={lg ? undefined : null}
        className="bg-secondary/10! border-r border-secondary/30 p-5"
      >
        <div className="flex items-center justify-center">
          <Logo size={40} />
        </div>

        <Menu
          mode="inline"
          selectedKeys={[activePath]}
          items={menuItems}
          className="dashboard-shell-menu text-gray-700! bg-transparent! border-none!"
          onClick={({ key }) => {
            void navigate({ to: key as never });
          }}
        />
      </Layout.Sider>

      <Layout>
        <Layout.Header className="dashboard-header">
          <Space size={16} align="center">
            <div>
              <Typography.Text className="header-eyebrow">
                NBR Licensing Portal
              </Typography.Text>
              <Typography.Title level={4} className="header-page-title">
                {currentTitle}
              </Typography.Title>
            </div>
          </Space>

          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Space className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
              <Avatar
                size="small"
                className="bg-primary!"
                icon={<UserOutlined />}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </Avatar>
              {lg && (
                <>
                  <Typography.Text className="font-medium">
                    {user?.name}
                  </Typography.Text>
                  <DownOutlined className="text-[10px] text-gray-400" />
                </>
              )}
            </Space>
          </Dropdown>
        </Layout.Header>

        <Layout.Content className="dashboard-content">
          <div className="dashboard-content-inner">{children}</div>
        </Layout.Content>

        <div className="w-full flex items-center justify-between p-4">
          <div className="flex items-center">
            <p className="text-sm text-gray-500 mb-0!">{portalDescriptor}</p>
            <div className="flex items-center gap-2">
              {activePath !== "/dashboard" ? (
                <p className="text-sm text-gray-500! mb-0! ml-2!">|</p>
              ) : null}
              {activePath !== "/dashboard" ? (
                <Link className="text-primary!" to="/dashboard">
                  Back to overview
                </Link>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} National Bank of Rwanda. All
            rights reserved.
          </p>
        </div>
      </Layout>
    </Layout>
  );
};

export default DashboardShell;
