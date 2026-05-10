import { App } from "antd";

export type FeedbackApi = ReturnType<typeof App.useApp>;
type FeedbackMethod = keyof Pick<FeedbackApi["message"], "success" | "error" | "info" | "warning">;
type PendingFeedback = {
  type: FeedbackMethod;
  payload: Parameters<FeedbackApi["message"][FeedbackMethod]>[0];
};

let feedbackApi: FeedbackApi | null = null;
const pendingFeedbackQueue: PendingFeedback[] = [];

export const setFeedbackApi = (api: FeedbackApi | null) => {
  feedbackApi = api;

  if (!feedbackApi || pendingFeedbackQueue.length === 0) {
    return;
  }

  while (pendingFeedbackQueue.length > 0) {
    const nextFeedback = pendingFeedbackQueue.shift();
    if (!nextFeedback) {
      continue;
    }

    feedbackApi.message[nextFeedback.type](nextFeedback.payload);
  }
};

export const getFeedbackApi = (): FeedbackApi | null => feedbackApi;

const emitFeedback = (
  type: FeedbackMethod,
  payload: Parameters<FeedbackApi["message"][FeedbackMethod]>[0],
) => {
  if (!feedbackApi) {
    pendingFeedbackQueue.push({ type, payload });
    return;
  }

  feedbackApi.message[type](payload);
};

export const feedback = {
  success: (message: Parameters<FeedbackApi["message"]["success"]>[0]) => {
    emitFeedback("success", message);
  },
  error: (message: Parameters<FeedbackApi["message"]["error"]>[0]) => {
    emitFeedback("error", message);
  },
  info: (message: Parameters<FeedbackApi["message"]["info"]>[0]) => {
    emitFeedback("info", message);
  },
  warning: (message: Parameters<FeedbackApi["message"]["warning"]>[0]) => {
    emitFeedback("warning", message);
  },
};
