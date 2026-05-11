import {
  Layout,
  Space,
  Typography,
  Dropdown,
  Avatar,
  Grid,
  type MenuProps,
} from "antd";
import { UserOutlined, DownOutlined } from "@ant-design/icons";
import { useAuthSession } from "@/features/auth/hooks/use-auth";

type DashboardHeaderProps = {
  currentTitle: string;
  userMenuItems: MenuProps["items"];
};

const DashboardHeader = ({
  currentTitle,
  userMenuItems,
}: DashboardHeaderProps) => {
  const { user } = useAuthSession();
  const { lg } = Grid.useBreakpoint();
  return (
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
          <Avatar size="small" className="bg-primary!" icon={<UserOutlined />}>
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
  );
};

export default DashboardHeader;
