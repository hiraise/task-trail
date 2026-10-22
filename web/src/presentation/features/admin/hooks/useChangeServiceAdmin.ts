import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ChangeServiceAdminPayload } from "@/application/payloads";
import type { AdminUser } from "@/domain/models/AdminUser";
import type { CurrentUser } from "@/domain/models/User";
import { getUserDisplayName } from "@/domain/models/User";
import { adminRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { adminTexts } from "@/shared/locales/admin";
import { interpolate } from "@/shared/utils/interpolate";

/**
 * Grants or revokes service administrator rights (ADR-0014). The server responds with the user, which
 * replaces the old one in the list. The last administrator cannot be removed: `LAST_ADMIN`.
 */
export function useChangeServiceAdmin() {
  const queryClient = useQueryClient();

  return useMutation<AdminUser, Error, ChangeServiceAdminPayload>({
    mutationFn: ({ userId, isAdmin }) => adminRepository.setAdmin(userId, isAdmin),
    onSuccess: (user) => {
      queryClient.setQueryData<AdminUser[]>(QUERY_KEYS.admin.users, (users) =>
        users?.map((current) => (current.id === user.id ? user : current)),
      );
      // Removed own administrator rights: access to the section depends on the current user's isAdmin
      const currentUser = queryClient.getQueryData<CurrentUser>(QUERY_KEYS.user.current);

      if (currentUser?.id === user.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.current });
      }
      const template = user.isAdmin ? adminTexts.madeAdmin : adminTexts.madeUser;

      toast.success(interpolate(template, { name: getUserDisplayName(user) }));
    },
    onError: (error) => {
      // The list is stale: the other administrators were already removed; show it as is
      if (hasErrorCode(error, "LAST_ADMIN")) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users });
      }
      toastError(error, adminTexts.changeAdminFailed);
    },
  });
}
