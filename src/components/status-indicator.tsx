type AppStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "INFO_REQUESTED"
  | "RESUBMITTED"
  | "READY_FOR_DECISION"
  | "APPROVED"
  | "REJECTED";

type UserStatus = "ACTIVE" | "DISABLED";

type KnownStatus = AppStatus | UserStatus;

const statusColorClass: Record<KnownStatus, string> = {
  DRAFT: "status-dot-neutral",
  SUBMITTED: "status-dot-blue",
  UNDER_REVIEW: "status-dot-cyan",
  INFO_REQUESTED: "status-dot-orange",
  RESUBMITTED: "status-dot-amber",
  READY_FOR_DECISION: "status-dot-teal",
  APPROVED: "status-dot-green",
  REJECTED: "status-dot-red",
  ACTIVE: "status-dot-green",
  DISABLED: "status-dot-red",
};

const getStatusColorClass = (status: string): string =>
  statusColorClass[status as KnownStatus] ?? "status-dot-neutral";

interface StatusIndicatorProps {
  status: string;
}

export const StatusIndicator = ({ status }: StatusIndicatorProps) => (
  <span className="status-indicator">
    <span className={`status-dot ${getStatusColorClass(status)}`} />
    <span className="capitalize">{status.replaceAll("_", " ").toLowerCase()}</span>
  </span>
);
