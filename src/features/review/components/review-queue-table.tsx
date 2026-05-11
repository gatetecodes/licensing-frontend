import { Button, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { MoreOutlined } from "@ant-design/icons";

import { StatusIndicator } from "@/components/status-indicator";
import { Table } from "@/components/table";
import type {
  Application,
  ApplicationState,
} from "@/features/applications/types/applications.types";

type ReviewQueueTableProps = {
  loading: boolean;
  applications: Application[];
  canReview: boolean;
  canCurrentUserDecide: (application: Application) => boolean;
  onViewDetails: (applicationId: string) => void;
  onStartReview: (application: Application) => void;
  onOpenRequestInformation: (application: Application) => void;
  onOpenMarkReady: (application: Application) => void;
  onOpenDecide: (application: Application) => void;
};

export const ReviewQueueTable = ({
  loading,
  applications,
  canReview,
  canCurrentUserDecide,
  onViewDetails,
  onStartReview,
  onOpenRequestInformation,
  onOpenMarkReady,
  onOpenDecide,
}: ReviewQueueTableProps) => (
  <div className="w-full bg-white p-4 rounded-md">
    <Table
      isPlainTable
      loading={loading}
      rowKey="id"
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
          title: "Actions",
          render: (_, record: Application) => {
            const actionItems: MenuProps["items"] = [
              {
                key: "view",
                label: "View Details",
                onClick: () => onViewDetails(record.id),
              },
            ];

            if (
              canReview &&
              (record.current_state === "SUBMITTED" ||
                record.current_state === "RESUBMITTED")
            ) {
              actionItems.push({
                key: "start-review",
                label: "Start Review",
                onClick: () => onStartReview(record),
              });
            }

            if (canReview && record.current_state === "UNDER_REVIEW") {
              actionItems.push({
                key: "request-info",
                label: "Request Information",
                onClick: () => onOpenRequestInformation(record),
              });
              actionItems.push({
                key: "mark-ready",
                label: "Mark Ready for Decision",
                onClick: () => onOpenMarkReady(record),
              });
            }

            if (
              canCurrentUserDecide(record) &&
              record.current_state === "READY_FOR_DECISION"
            ) {
              actionItems.push({
                key: "decide",
                label: "Make Decision",
                onClick: () => onOpenDecide(record),
              });
            }

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
  </div>
);
