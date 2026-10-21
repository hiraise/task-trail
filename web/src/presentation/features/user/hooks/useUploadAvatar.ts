import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { UploadAvatarPayload } from "@/application/payloads";
import { uploadAvatarUseCase } from "@/application/usecases";
import { logger } from "@/infrastructure/config/clientLogger";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to handle the upload of a user's avatar.
 *
 * This hook uses a mutation to perform the avatar upload operation and provides
 * success and error handling. On successful upload, it invalidates the current
 * user query to refresh the user data and displays a success toast notification.
 * On failure, it logs the error and displays an error toast notification.
 *
 * @returns A mutation object that can be used to trigger the avatar upload operation.
 *
 * @example
 * const { mutate: uploadAvatar, isLoading, isError } = useUploadAvatar();
 *
 * uploadAvatar(payload, {
 *   onSuccess: () => {
 *     console.log("Avatar uploaded successfully!");
 *   },
 *   onError: (error) => {
 *     console.error("Error uploading avatar:", error);
 *   },
 * });
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation<string | null, Error, UploadAvatarPayload>({
    mutationFn: (payload) => uploadAvatarUseCase(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.current });
      toast.success("Avatar updated successfully!");
    },
    onError: (error) => {
      logger.error("Failed to update avatar", { error });
      toast.error("Failed to update avatar");
    },
  });
}
