import { Alert, Button, Typography } from "antd";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { getAxiosApiErrorMessage } from "../../../lib/api-error";
import { feedback } from "../../../lib/feedback/feedback-bridge";
import { getDefaultAuthenticatedRoute } from "../utils/role-access";
import { useVerifyEmailMutation } from "../hooks/use-auth";
import AuthLayout from "../layout";
import { verifyEmailTokenSchema } from "../types/auth.schemas";

const { Title, Paragraph } = Typography;

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const verifyMutation = useVerifyEmailMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasTriggeredAutoVerifyRef = useRef(false);

  const token = useMemo(() => {
    const parsed = verifyEmailTokenSchema.safeParse({
      token: typeof search.token === "string" ? search.token : "",
    });
    return parsed.success ? parsed.data.token : "";
  }, [search.token]);

  const handleVerify = async () => {
    if (!token) {
      setSubmitError("Verification token is missing or invalid.");
      return;
    }

    setSubmitError(null);
    try {
      const session = await verifyMutation.mutateAsync({ token });
      const destination = getDefaultAuthenticatedRoute(session.user);
      feedback.success("Email verified successfully. You are now signed in.");
      await navigate({ to: destination });
    } catch (error) {
      setSubmitError(
        getAxiosApiErrorMessage(
          error,
          "Email verification failed. Please request a new verification link.",
        ),
      );
    }
  };

  useEffect(() => {
    if (!token || hasTriggeredAutoVerifyRef.current || verifyMutation.isPending) {
      return;
    }
    hasTriggeredAutoVerifyRef.current = true;
    void handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, verifyMutation.isPending]);

  return (
    <AuthLayout>
      <Title level={2}>Verify Email</Title>
      <Paragraph type="secondary">
        Confirm your applicant account to activate access to the licensing portal.
      </Paragraph>
      {submitError ? (
        <Alert className="auth-error-alert" type="error" showIcon message={submitError} />
      ) : null}
      <Alert
        type={token ? "info" : "warning"}
        showIcon
        message={token ? "Ready to verify" : "Verification token missing"}
        description={
          token
            ? "Verification is triggered automatically. You can also retry manually."
            : "Open this page from your verification email link."
        }
      />
      <Button
        type="primary"
        block
        size="large"
        loading={verifyMutation.isPending}
        disabled={!token}
        onClick={() => void handleVerify()}
      >
        Verify Email Again
      </Button>
      <div className="auth-links">
        <Link to="/login">Back to login</Link>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
