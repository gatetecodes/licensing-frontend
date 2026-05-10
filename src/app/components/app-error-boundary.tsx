import { Result, Button } from "antd";
import React, { type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError() {
    return { hasError: true };
  }

  public componentDidCatch(error: unknown) {
    console.error("App error boundary caught an error", error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle="Please reload the page to continue."
          extra={[
            <Button type="primary" key="reload" onClick={() => window.location.reload()}>
              Reload
            </Button>,
          ]}
        />
      );
    }

    return this.props.children;
  }
}
