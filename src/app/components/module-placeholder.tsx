import { Card, Space, Tag, Typography } from "antd";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  status?: string;
}

const ModulePlaceholder = ({
  title,
  description,
  status = "Foundation Ready",
}: ModulePlaceholderProps) => (
  <Card className="module-placeholder-card" bordered={false}>
    <Space direction="vertical" size={8}>
      <Tag color="green">{status}</Tag>
      <Typography.Title level={3} className="module-placeholder-title">
        {title}
      </Typography.Title>
      <Typography.Paragraph type="secondary" className="module-placeholder-description">
        {description}
      </Typography.Paragraph>
    </Space>
  </Card>
);

export default ModulePlaceholder;
