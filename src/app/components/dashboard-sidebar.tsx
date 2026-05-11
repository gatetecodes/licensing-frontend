import { Grid, Layout, Menu } from "antd";
import { Logo } from "@/components/logo";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useAuthSession } from "@/features/auth/hooks/use-auth";
import { useMemo, type ReactNode } from "react";
import { Icon } from "@iconify/react";
import type { RoleName } from "@/features/auth/types/auth.types";
import type { ProtectedRoutePath } from "@/features/auth/utils/role-access";

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
    icon: (
      <Icon icon="solar:users-group-rounded-bold-duotone" className="size-6" />
    ),
    isVisible: (roleName) => roleName === "ADMIN" || roleName === "SUPER_ADMIN",
  },
  {
    key: "/settings",
    label: "Settings",
    icon: <Icon icon="lets-icons:setting-line-duotone" className="size-6" />,
    isVisible: () => true,
  },
];

const DashboardSidebar = () => {
  const { user } = useAuthSession();
  const { lg } = Grid.useBreakpoint();
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = location.pathname;
  const roleName = user?.role?.name;
  const menuItems = useMemo(
    () =>
      navigationItems
        .filter((item) => item.isVisible(roleName))
        .map((item) => ({ key: item.key, icon: item.icon, label: item.label })),
    [roleName],
  );
  return (
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
           navigate({ to: key as never });
        }}
      />
    </Layout.Sider>
  );
};

export default DashboardSidebar;
