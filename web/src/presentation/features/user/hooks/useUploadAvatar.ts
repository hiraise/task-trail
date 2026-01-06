import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { UploadAvatarCommand } from "@/application/commands/user/UploadAvatarCommand";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to handle avatar upload for the current user.
 *
 * Utilizes a mutation to execute the avatar upload use case, providing feedback via toast notifications
 * and invalidating the current user query on success to ensure fresh data.
 *
 * @returns A mutation result object for uploading the avatar, including status and mutation methods.
 *
 * @example
 * const uploadAvatar = useUploadAvatar();
 * uploadAvatar.mutate({ file: avatarFile });
 */
export function useUploadAvatar(): UseMutationResult<string | null, Error, UploadAvatarCommand> {
  const queryClient = useQueryClient();
  const { uploadAvatar } = appContainer.getUsecases().user;

  return useMutation({
    mutationFn: (command) => uploadAvatar.execute(command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
      toast.success("Avatar updated successfully!");
    },
    onError: (error) => {
      clientLogger.error("Failed to update avatar", { error });
      toast.error("Failed to update avatar");
    },
  });
}
