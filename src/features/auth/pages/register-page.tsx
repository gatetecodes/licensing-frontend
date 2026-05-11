import { Alert, Button, Form, Input, Typography } from "antd";
import { Link } from "@tanstack/react-router";
import { Controller } from "react-hook-form";
import { useState } from "react";

import { getAxiosApiErrorMessage } from "../../../lib/api-error";
import { feedback } from "../../../lib/feedback/feedback-bridge";
import { useZodForm } from "../../../lib/forms/use-zod-form";
import { useRegisterMutation } from "../hooks/use-auth";
import { registerFormSchema, type RegisterFormValues } from "../types/auth.schemas";
import AuthLayout from "../layout";

const { Title, Paragraph } = Typography;

const RegisterPage = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const registerMutation = useRegisterMutation();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useZodForm(registerFormSchema, {
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      institution_name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isBusy = registerMutation.isPending || isSubmitting;

  const onSubmit = async (payload: RegisterFormValues) => {
    setSubmitError(null);
    try {
      await registerMutation.mutateAsync({
        name: payload.name,
        email: payload.email,
        institution_name: payload.institution_name,
        password: payload.password,
      });
      setRegisteredEmail(payload.email);
      reset();
      feedback.success("Registration submitted. Please check your email to verify.");
    } catch (error) {
      setSubmitError(
        getAxiosApiErrorMessage(
          error,
          "Registration failed. Please review your details and try again.",
        ),
      );
    }
  };

  return (
    <AuthLayout>
      <Title level={2}>Applicant Registration</Title>
      <Paragraph type="secondary">
        Create your applicant account to start and track licensing applications.
      </Paragraph>
      {submitError ? (
        <Alert
          className="auth-error-alert"
          type="error"
          showIcon
          message={submitError}
        />
      ) : null}
      {registeredEmail ? (
        <Alert
          type="success"
          showIcon
          message="Registration successful"
          description={`We've sent a verification link to ${registeredEmail}. Open that email to activate your account.`}
        />
      ) : (
        <Form
          layout="vertical"
          className="auth-form"
          onFinish={handleSubmit(onSubmit)}
          disabled={isBusy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Full name"
              required
              validateStatus={errors.name ? "error" : undefined}
              help={errors.name?.message}
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    size="large"
                    placeholder="e.g. Alice Mukamana"
                  />
                )}
              />
            </Form.Item>
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
                    size="large"
                    placeholder="name@institution.com"
                  />
                )}
              />
            </Form.Item>
          </div>
          <Form.Item
            label="Institution"
            required
            validateStatus={errors.institution_name ? "error" : undefined}
            help={errors.institution_name?.message}
          >
            <Controller
              name="institution_name"
              control={control}
              render={({ field }) => (
                <Input {...field} size="large" placeholder="Institution name" />
              )}
            />
          </Form.Item>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    size="large"
                    placeholder="Create a secure password"
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              label="Confirm Password"
              required
              validateStatus={errors.confirmPassword ? "error" : undefined}
              help={errors.confirmPassword?.message}
            >
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    size="large"
                    placeholder="Confirm password"
                  />
                )}
              />
            </Form.Item>
          </div>
          <Button
            htmlType="submit"
            type="primary"
            block
            loading={isBusy}
            size="large"
            className="shadow-none! mt-10!"
          >
            Create Account
          </Button>
        </Form>
      )}
      <div className="auth-links">
        <Link to="/login" className="text-primary!">Back to login</Link>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
