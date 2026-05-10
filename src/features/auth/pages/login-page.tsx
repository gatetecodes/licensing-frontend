import { Alert, Button, Form, Input, Typography } from "antd";
import { Link, useNavigate } from "@tanstack/react-router";
import { Controller } from "react-hook-form";
import { useState } from "react";

import { getAxiosApiErrorMessage } from "../../../lib/api-error";
import { feedback } from "../../../lib/feedback/feedback-bridge";
import { useZodForm } from "../../../lib/forms/use-zod-form";
import { getDefaultAuthenticatedRoute } from "../utils/role-access";
import { useLoginMutationWithOptions } from "../hooks/use-auth";
import type { LoginPayload } from "../types/auth.types";
import { loginFormSchema } from "../types/auth.schemas";
import AuthLayout from "../layout";

const { Title, Paragraph } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm(loginFormSchema, {
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useLoginMutationWithOptions({
    onSuccess: async (session) => {
      const destination = getDefaultAuthenticatedRoute(session.user);
      feedback.success("Login successful. Redirecting to your workspace.");
      await navigate({ to: destination });
    },
    onError: (error) => {
      setSubmitError(
        getAxiosApiErrorMessage(
          error,
          "Login failed. Please verify your credentials and try again.",
        ),
      );
    },
  });

  const isBusy = loginMutation.isPending || isSubmitting;

  const onSubmit = async (payload: LoginPayload) => {
    setSubmitError(null);
    await loginMutation.mutateAsync(payload);
  };

  return (
    <AuthLayout>
      <div className="">
        <Title level={2}>Sign In</Title>
        <Paragraph type="secondary">
          Use your account credentials to access the licensing portal.
        </Paragraph>

        {submitError ? (
          <Alert
            className="auth-error-alert"
            type="error"
            showIcon
            message={submitError}
          />
        ) : null}

        <Form
          layout="vertical"
          onFinish={handleSubmit(onSubmit)}
          disabled={isBusy}
        >
          <Form.Item
            label="Email"
            required
            validateStatus={errors.email ? "error" : undefined}
            help={errors.email?.message}
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  autoComplete="email"
                  size="large"
                  placeholder="your.email@example.com"
                  onChange={(event) => {
                    field.onChange(event.target.value);
                    if (submitError) {
                      setSubmitError(null);
                    }
                  }}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            required
            validateStatus={errors.password ? "error" : undefined}
            help={errors.password?.message}
          >
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  autoComplete="current-password"
                  size="large"
                  placeholder="Enter your password"
                  onChange={(event) => {
                    field.onChange(event.target.value);
                    if (submitError) {
                      setSubmitError(null);
                    }
                  }}
                />
              )}
            />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            block
            loading={isBusy}
            size="large"
            className="shadow-none! mt-10!"
          >
            {isBusy ? "Signing In..." : "Sign In"}
          </Button>
        </Form>

        <div className=" mt-5! text-center">
          Don't have an account? <Link className="text-primary!" to="/register">Create applicant account</Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
