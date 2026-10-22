import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { UploadAvatarPayload } from "@/application/payloads";
import { uploadAvatarUseCase } from "@/application/usecases";
import type { CurrentUser } from "@/domain/models/User";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { TEXTS } from "@/shared/locales/texts";

/** Аватарка текущего пользователя: JPEG, PNG или WebP до 5 МБ (ADR-0013). */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation<CurrentUser, Error, UploadAvatarPayload>({
    mutationFn: (payload) => uploadAvatarUseCase(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(QUERY_KEYS.user.current, user);
      toast.success(TEXTS.profile.avatarUpdated);
    },
    onError: (error) => toastError(error, TEXTS.profile.avatarUpdateFailed),
  });
}
