import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CurrentUser } from "@/domain/models/User";
import { userRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { notificationsTexts } from "@/shared/locales/notifications";

/** Notification emails on or off (ADR-0038); the server responds with the updated user. */
export function useSetEmailNotifications() {
  const queryClient = useQueryClient();

  return useMutation<CurrentUser, Error, boolean>({
    mutationFn: (enabled) => userRepository.setEmailNotifications(enabled),
    onSuccess: (user) => queryClient.setQueryData(QUERY_KEYS.user.current, user),
    onError: (error) => toastError(error, notificationsTexts.emailSaveFailed),
  });
}
