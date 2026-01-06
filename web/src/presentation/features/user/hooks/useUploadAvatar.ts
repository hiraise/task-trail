import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { UploadAvatarPayload } from "@/application/payloads";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export function useUploadAvatar(): UseMutationResult<string | null, Error, UploadAvatarPayload> {
  const queryClient = useQueryClient();
  const { uploadAvatar } = appContainer.getUsecases().user;

  return useMutation({
    mutationFn: (payload) => uploadAvatar.execute(payload),
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
