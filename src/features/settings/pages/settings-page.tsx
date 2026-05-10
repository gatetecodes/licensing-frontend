import { Button, Card, Descriptions, Space, Typography } from "antd";

import { useAuthSession, useLogoutMutation } from "@/features/auth/hooks/use-auth";
import { feedback } from "@/lib/feedback/feedback-bridge";
import { getAxiosApiErrorMessage } from "@/lib/api-error";

const { Title, Paragraph } = Typography;

const SettingsPage = () => {
  const { user } = useAuthSession();
  const logoutMutation = useLogoutMutation();

  return (
    <Space direction="vertical" size={16} className="w-full">
      <div>
        <Title level={2}>Settings</Title>
        <Paragraph type="secondary">
          Review account and session details for the active user.
        </Paragraph>
      </div>
      <Card bordered={false}>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Name">{user?.name ?? "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Email">{user?.email ?? "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Role">{user?.role?.name ?? "N/A"}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card bordered={false}>
        <Button
          danger
          loading={logoutMutation.isPending}
          onClick={async () => {
            try {
              await logoutMutation.mutateAsync();
              feedback.success("Session ended successfully.");
            } catch (error) {
              feedback.error(getAxiosApiErrorMessage(error, "Failed to end session."));
            }
          }}
        >
          End Current Session
        </Button>
      </Card>
    </Space>
  );
};

export default SettingsPage;
