import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminService } from "../services/admin.service";
import type {
  InviteInternalUserPayload,
  ManagedUserStatus,
} from "../types/admin.types";

export const adminQueryKeys = {
  users: (status?: ManagedUserStatus, role?: string) =>
    ["admin", "users", status ?? "ALL", role ?? "ALL"] as const,
};

export const useAdminUsers = (filters?: { status?: ManagedUserStatus; role?: string }) =>
  useQuery({
    queryKey: adminQueryKeys.users(filters?.status, filters?.role),
    queryFn: () => adminService.listUsers(filters),
  });

export const useUpdateInternalUserStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminService.updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
};

export const useInviteInternalUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteInternalUserPayload) =>
      adminService.inviteInternalUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
};
