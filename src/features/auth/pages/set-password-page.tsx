import { Alert, Button, Form, Input, Typography } from "antd";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Controller } from "react-hook-form";
import { useMemo, useState } from "react";

import { getAxiosApiErrorMessage } from "../../../lib/api-error";
import { feedback } from "../../../lib/feedback/feedback-bridge";
import { useZodForm } from "../../../lib/forms/use-zod-form";
import { useSetPasswordMutation } from "../hooks/use-auth";
import {
  setPasswordFormSchema,
  type SetPasswordFormValues,
} from "../types/auth.schemas";
import AuthLayout from "../layout";

const { Title, Paragraph } = Typography;

const SetPasswordPage = () => {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const setPasswordMutation = useSetPasswordMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const token = useMemo(
    () => (typeof search.token === "string" ? search.token : ""),
    [search.token],
  );
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm(setPasswordFormSchema, {
    mode: "onTouched",
    defaultValues: {
      token,
      newPassword: "",
      confirmPassword: "",
    },
  });

  const isBusy = setPasswordMutation.isPending || isSubmitting;

  const onSubmit = async (payload: SetPasswordFormValues) => {
    setSubmitError(null);
    try {
      await setPasswordMutation.mutateAsync(payload);
      feedback.success("Password set successfully. Please sign in.");
      await navigate({ to: "/login" });
    } catch (error) {
      setSubmitError(
        getAxiosApiErrorMessage(
          error,
          "Password setup failed. Check your token and try again.",
        ),
      );
    }
  };

  return (
    <AuthLayout>
      <Title level={2}>Set Password</Title>
      <Paragraph type="secondary">
        Complete internal account activation using your invitation token.
      </Paragraph>

      {submitError ? (
        <Alert className="auth-error-alert" type="error" showIcon message={submitError} />
      ) : null}

      <Form layout="vertical" className="auth-form" onFinish={handleSubmit(onSubmit)} disabled={isBusy}>
        <Form.Item label="Setup token" required validateStatus={errors.token ? "error" : undefined} help={errors.token?.message}>
          <Controller
            name="token"
            control={control}
            render={({ field }) => <Input {...field} size="large" placeholder="Invitation token" />}
          />
        </Form.Item>
        <Form.Item label="New password" required validateStatus={errors.newPassword ? "error" : undefined} help={errors.newPassword?.message}>
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => <Input.Password {...field} size="large" placeholder="Enter new password" />}
          />
        </Form.Item>
        <Form.Item
          label="Confirm password"
          required
          validateStatus={errors.confirmPassword ? "error" : undefined}
          help={errors.confirmPassword?.message}
        >
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => <Input.Password {...field} size="large" placeholder="Confirm password" />}
          />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={isBusy} disabled={!token}>
          Set Password
        </Button>
      </Form>

      <div className="auth-links">
        <Link to="/login">Back to login</Link>
      </div>
    </AuthLayout>
  );
};

export default SetPasswordPage;
