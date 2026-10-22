import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { UpdateUserPayload } from "@/application/payloads";
import type { CurrentUser } from "@/domain/models/User";
import { userRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { TEXTS } from "@/shared/locales/texts";

/** Имя текущего пользователя; сервер отвечает изменённым пользователем (ADR-0018). */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<CurrentUser, Error, UpdateUserPayload>({
    mutationFn: (payload) => userRepository.updateCurrentUser(payload.username),
    onSuccess: (user) => {
      queryClient.setQueryData(QUERY_KEYS.user.current, user);
      toast.success(TEXTS.profile.userUpdated);
    },
    onError: (error) => toastError(error, TEXTS.profile.userUpdateFailed),
  });
}
