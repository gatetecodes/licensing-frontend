import { useEffect, type ReactNode } from "react";
import { App, ConfigProvider, theme, type ThemeConfig } from "antd";

import { setFeedbackApi } from "../../lib/feedback/feedback-bridge";

const antdTheme: ThemeConfig = {
  algorithm: [theme.defaultAlgorithm],
  token: {
    colorPrimary: "#753918",
    borderRadius: 8,
    fontFamily: "var(--font-sans)",
  },
};

const FeedbackBridge = ({ children }: { children: ReactNode }) => {
  const feedbackApi = App.useApp();

  useEffect(() => {
    setFeedbackApi(feedbackApi);

    return () => {
      setFeedbackApi(null);
    };
  }, [feedbackApi]);

  return children;
};

export const AntdProvider = ({ children }: { children: ReactNode }) => (
  <ConfigProvider theme={antdTheme}>
    <App>
      <FeedbackBridge>{children}</FeedbackBridge>
    </App>
  </ConfigProvider>
);
