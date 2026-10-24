import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { UploadAvatarPayload } from "@/application/payloads";
import { uploadAvatarUseCase } from "@/application/usecases";
import type { CurrentUser } from "@/domain/models/User";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { TEXTS } from "@/shared/locales/texts";

/** Avatar of the current user: JPEG, PNG or WebP up to 5 MB (ADR-0013). */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation<CurrentUser, Error, UploadAvatarPayload>({
    mutationFn: (payload) => uploadAvatarUseCase(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(QUERY_KEYS.user.current, user);
      toast.success(TEXTS.profile.avatarUpdated);
    },
    onError: (error) => {
      // FILE_TOO_LARGE has a neutral text shared with attachments: the avatar names its own limit
      if (hasErrorCode(error, "FILE_TOO_LARGE")) {
        toast.error(TEXTS.profile.avatarTooLarge);

        return;
      }
      toastError(error, TEXTS.profile.avatarUpdateFailed);
    },
  });
}
