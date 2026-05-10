import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";

import { AppErrorBoundary } from "../components/app-error-boundary";
import { router } from "../router/router";
import { AntdProvider } from "./antd-provider";
import { queryClient } from "./query-client";

export const AppProviders = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AntdProvider>
        <RouterProvider router={router} context={{ queryClient }} />
        {import.meta.env.DEV ? (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        ) : null}
      </AntdProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);
