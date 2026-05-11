import { Button, Card, Dropdown, Select, Space } from "antd";
import type { MenuProps } from "antd";
import { MoreOutlined } from "@ant-design/icons";

import { Table } from "@/components/table";
import { StatusIndicator } from "@/components/status-indicator";
import type {
  Application,
  ApplicationState,
} from "../types/applications.types";

type ApplicationsListCardProps = {
  canManageDrafts: boolean;
  applications: Application[];
  loading: boolean;
  stateFilter?: ApplicationState;
  stateOptions: ApplicationState[];
  onStateFilterChange: (value: ApplicationState | undefined) => void;
  onCreateApplication: () => void;
  onViewApplication: (applicationId: string) => void;
  onContinueDraft: (application: Application) => void;
};

const ApplicationsList = ({
  canManageDrafts,
  applications,
  loading,
  stateFilter,
  stateOptions,
  onStateFilterChange,
  onCreateApplication,
  onViewApplication,
  onContinueDraft,
}: ApplicationsListCardProps) => (
  <Card
    bordered={false}
    title="Application List"
    className="shadow-none!"
    extra={
      <Space>
        {canManageDrafts ? (
          <Button
            type="primary"
            onClick={onCreateApplication}
            className="shadow-none!"
          >
            Create Application
          </Button>
        ) : null}
        <Select
          allowClear
          placeholder="Filter by state"
          style={{ minWidth: 200 }}
          value={stateFilter}
          onChange={(value) => onStateFilterChange(value)}
          options={stateOptions.map((value) => ({
            value,
            label: value,
          }))}
        />
      </Space>
    }
  >
    <Table
      isPlainTable
      rowKey="id"
      loading={loading}
      dataSource={applications}
      pagination={{ pageSize: 8 }}
      columns={[
        { title: "Reference", dataIndex: "reference_number" },
        { title: "Institution", dataIndex: "institution_name" },
        {
          title: "State",
          dataIndex: "current_state",
          render: (value: ApplicationState) => (
            <StatusIndicator status={value} />
          ),
        },
        {
          title: "Updated",
          dataIndex: "updated_at",
          render: (value: string) => (
            <span>{new Date(value).toLocaleString()}</span>
          ),
        },
        {
          title: "Action",
          render: (_: unknown, record: Application) => {
            const actionItems: MenuProps["items"] = [
              {
                key: "view",
                label: "View",
                onClick: () => onViewApplication(record.id),
              },
              ...(canManageDrafts &&
              (record.current_state === "DRAFT" ||
                record.current_state === "INFO_REQUESTED")
                ? [
                    {
                      key: "continue-draft",
                      label:
                        record.current_state === "DRAFT"
                          ? "Continue Draft"
                          : "Respond To Request",
                      onClick: () => onContinueDraft(record),
                    },
                  ]
                : []),
            ];

            return (
              <Dropdown menu={{ items: actionItems }} trigger={["click"]}>
                <Button
                  icon={<MoreOutlined />}
                  aria-label="Application actions"
                  className="shadow-none!"
                />
              </Dropdown>
            );
          },
        },
      ]}
    />
  </Card>
);

export default ApplicationsList;
