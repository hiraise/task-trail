import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { userService } from "@/infrastructure/api/userService";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation<string | null, Error, FormData>({
    mutationFn: userService.uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
      toast.success("Avatar updated successfully!");
    },
    onError: (error) => {
      clientLogger.error("Failed to update avatar", { error });
      toast.error("Failed to update avatar");
    },
  });
};
