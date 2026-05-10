import { useQuery } from "@tanstack/react-query";

import { auditService } from "../services/audit.service";

export const auditQueryKeys = {
  list: (applicationId?: string) => ["audit", "list", applicationId ?? ""] as const,
};

export const useApplicationAuditLog = (applicationId?: string) =>
  useQuery({
    queryKey: auditQueryKeys.list(applicationId),
    queryFn: () => auditService.getByApplicationId(applicationId!),
    enabled: Boolean(applicationId),
  });
