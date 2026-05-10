import {
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Typography,
} from "antd";

import { StatusIndicator } from "@/components/status-indicator";
import { Table } from "@/components/table";
import { useApplicationsList } from "@/features/applications/hooks/use-applications";
import type { ApplicationState } from "@/features/applications/types/applications.types";
import { useAuthSession } from "@/features/auth/hooks/use-auth";
import {
  isAdmin,
  isApplicant,
  isApprover,
  isReviewer,
  isSuperAdmin,
} from "@/features/auth/utils/role.utils";

const DashboardPage = () => {
  const { user } = useAuthSession();
  const listQuery = useApplicationsList({
    viewerId: user?.id,
    viewerRole: user?.role?.name,
    enabled: Boolean(user),
  });
  const items = listQuery.data?.items ?? [];
  const total = items.length;
  const countByState = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.current_state] = (acc[item.current_state] ?? 0) + 1;
    return acc;
  }, {});
  const dashboardActivity = items.slice(0, 6).map((item) => ({
    key: item.id,
    reference: item.reference_number,
    institution: item.institution_name,
    state: item.current_state,
    updatedAt: item.updated_at,
  }));
  const isInternalOps = isAdmin(user) || isSuperAdmin(user);
  const isQueueViewer = isReviewer(user) || isApprover(user) || isInternalOps;

  const heading = isApplicant(user)
    ? "Applicant Dashboard"
    : isReviewer(user)
      ? "Reviewer Dashboard"
      : isApprover(user)
        ? "Approver Dashboard"
        : "Licensing Operations Dashboard";
  const subtitle = isApplicant(user)
    ? "Track your own submissions, respond to information requests, and follow final decisions."
    : isReviewer(user)
      ? "Monitor review workload and move eligible applications through review transitions."
      : isApprover(user)
        ? "Focus on decision-ready applications and final decision outcomes."
        : "Real-time overview for submission flow, review health, and decision throughput.";

  const metricCards = isApplicant(user)
    ? [
        { title: "My Applications", value: total },
        { title: "Drafts", value: countByState.DRAFT ?? 0 },
        { title: "Info Requested", value: countByState.INFO_REQUESTED ?? 0 },
        {
          title: "Final Decisions",
          value: (countByState.APPROVED ?? 0) + (countByState.REJECTED ?? 0),
        },
      ]
    : isReviewer(user)
      ? [
          { title: "Queue Size", value: total },
          { title: "Submitted", value: countByState.SUBMITTED ?? 0 },
          { title: "Under Review", value: countByState.UNDER_REVIEW ?? 0 },
          { title: "Resubmitted", value: countByState.RESUBMITTED ?? 0 },
        ]
      : isApprover(user)
        ? [
            { title: "Queue Size", value: total },
            { title: "Ready For Decision", value: countByState.READY_FOR_DECISION ?? 0 },
            { title: "Approved", value: countByState.APPROVED ?? 0 },
            { title: "Rejected", value: countByState.REJECTED ?? 0 },
          ]
        : [
            { title: "Total Applications", value: total },
            { title: "Under Review", value: countByState.UNDER_REVIEW ?? 0 },
            { title: "Info Requested", value: countByState.INFO_REQUESTED ?? 0 },
            {
              title: "Ready For Decision",
              value: countByState.READY_FOR_DECISION ?? 0,
            },
          ];

  const visibleRows = dashboardActivity.filter((item) => {
    if (isApplicant(user)) {
      return true;
    }
    if (isReviewer(user)) {
      return (
        item.state === "SUBMITTED" ||
        item.state === "UNDER_REVIEW" ||
        item.state === "INFO_REQUESTED" ||
        item.state === "RESUBMITTED"
      );
    }
    if (isApprover(user)) {
      return (
        item.state === "READY_FOR_DECISION" ||
        item.state === "APPROVED" ||
        item.state === "REJECTED"
      );
    }
    return true;
  });

  return (
    <div className="dashboard-page">
      <Space direction="vertical" size={4}>
        <Typography.Title level={2} className="page-title">
          {heading}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className="page-subtitle">
          {subtitle}
        </Typography.Paragraph>
      </Space>

      <Row gutter={[16, 16]}>
        {metricCards.map((metric) => (
          <Col key={metric.title} xs={24} sm={12} xl={6}>
            <Card bordered={false} className="metric-card shadow-none!">
              <Statistic
                title={metric.title}
                value={metric.value}
                loading={listQuery.isLoading}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title={
              isApplicant(user)
                ? "My Latest Application Activity"
                : isQueueViewer
                  ? "Queue Activity"
                  : "Latest Application Activity"
            }
            bordered={false}
            className="dashboard-section-card shadow-none!"
          >
            <Table
              isPlainTable
              dataSource={visibleRows}
              loading={listQuery.isLoading}
              pagination={false}
              size="small"
              rowKey="key"
              columns={[
                {
                  title: "Reference",
                  dataIndex: "reference",
                },
                {
                  title: "Institution",
                  dataIndex: "institution",
                },
                {
                  title: "Status",
                  dataIndex: "state",
                  render: (state: ApplicationState) => (
                    <StatusIndicator status={state} />
                  ),
                },
                {
                  title: "Updated",
                  dataIndex: "updatedAt",
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
