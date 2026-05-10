import { Card, Select, Typography, Empty, Space } from "antd";
import { useState } from "react";
import dayjs from "dayjs";
import { Icon } from "@iconify/react";

import { Table } from "@/components/table";
import { StatusIndicator } from "@/components/status-indicator";
import { useApplicationsList } from "@/features/applications/hooks/use-applications";
import { useAuthSession } from "@/features/auth/hooks/use-auth";
import { useApplicationAuditLog } from "../hooks/use-audit";

const { Title, Paragraph, Text } = Typography;

const AuditLogPage = () => {
  const { user } = useAuthSession();
  const [applicationId, setApplicationId] = useState<string>();
  const appsQuery = useApplicationsList({
    viewerId: user?.id,
    viewerRole: user?.role?.name,
    enabled: Boolean(user),
  });
  const auditQuery = useApplicationAuditLog(applicationId);

  return (
    <div className="dashboard-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <Title level={2} className="mb-1!">
            Audit Trail
          </Title>
          <Paragraph type="secondary" className="mb-0!">
            Immutable timeline of workflow and decision events.
          </Paragraph>
        </div>

        <div className="flex items-center gap-3">
          <Text strong className="text-gray-500 whitespace-nowrap">
            Application:
          </Text>
          <Select
            showSearch
            className="w-[320px]"
            placeholder="Search and select application"
            value={applicationId}
            onChange={(value) => setApplicationId(value)}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={(appsQuery.data?.items ?? []).map((application) => ({
              value: application.id,
              label: `${application.reference_number} - ${application.institution_name}`,
            }))}
          />
        </div>
      </div>

      {!applicationId ? (
        <Card bordered={false} className="shadow-none! py-12">
          <Empty
            image={
              <div className="flex justify-center text-gray-200">
                <Icon icon="lucide:history" fontSize={64} />
              </div>
            }
            description={
              <Space direction="vertical" size="small" align="center">
                <Text strong className="text-lg text-gray-600">
                  No Application Selected
                </Text>
                <Text type="secondary">
                  Please select an application from the dropdown above to view
                  its full audit history.
                </Text>
              </Space>
            }
          />
        </Card>
      ) : (
        <Card bordered={false} className="shadow-none!">
          <Table
            isPlainTable
            rowKey="id"
            loading={auditQuery.isLoading}
            dataSource={auditQuery.data?.items ?? []}
            pagination={{ pageSize: 15 }}
            columns={[
              {
                title: "Action",
                dataIndex: "action_type",
                render: (value: string) => (
                  <Text strong className="text-xs uppercase tracking-wider">
                    {value.replaceAll("_", " ")}
                  </Text>
                ),
              },
              {
                title: "Before",
                dataIndex: "before_state",
                render: (state: string) =>
                  state ? <StatusIndicator status={state} /> : "-",
              },
              {
                title: "After",
                dataIndex: "after_state",
                render: (state: string) =>
                  state ? <StatusIndicator status={state} /> : "-",
              },
              {
                title: "Actor",
                dataIndex: "acting_user_name",
                render: (name: string) => (
                  <Text className="text-gray-600">{name}</Text>
                ),
              },
              {
                title: "Occurred",
                dataIndex: "occurred_at",
                render: (date: string) => (
                  <Text type="secondary" className="text-xs">
                    {dayjs(date).format("MMM D, YYYY HH:mm:ss")}
                  </Text>
                ),
              },
              {
                title: "Request ID",
                dataIndex: "request_id",
                render: (id: string) => (
                  <Text
                    type="secondary"
                    className="font-mono text-[10px]"
                    title={id}
                  >
                    {id.slice(0, 8)}...
                  </Text>
                ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
};

export default AuditLogPage;
