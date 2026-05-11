import { Space, Spin, Typography } from "antd";

interface LoadingIndicatorProps {
  text: string;
}

const LoadingIndicator = ({ text }: LoadingIndicatorProps) => {
  return (
    <div className="fixed inset-0 z-1100 bg-black/20 flex items-center justify-center">
      <div className="bg-white rounded-lg px-5 py-4 shadow-md">
        <Space size={12} align="center">
          <Spin size="small" />
          <Typography.Text className="mb-0!">{text}</Typography.Text>
        </Space>
      </div>
    </div>
  );
};

export default LoadingIndicator;
