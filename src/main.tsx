import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "antd/dist/reset.css";
import "./styles/colors.scss";
import "./index.css";

import { AppProviders } from "./app/providers/app-providers";
import { queryClient } from "./app/providers/query-client";
import { router } from "./app/router/router";
import { configureAxiosApiClient } from "./lib/axios";

configureAxiosApiClient({
  queryClient,
  onUnauthorized: () => {
    void router.navigate({ to: "/login" });
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
);
