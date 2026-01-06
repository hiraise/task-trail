import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { UserResponseDto } from "@/application/dto/UserResponseDto";
import type { UpdateUserPayload } from "@/application/payloads";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export function useUpdateUser(): UseMutationResult<UserResponseDto, Error, UpdateUserPayload> {
  const queryClient = useQueryClient();
  const { updateUser } = appContainer.getUsecases().user;

  return useMutation({
    mutationFn: (payload) => updateUser.execute(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
      toast.success("User updated successfully");
    },
    onError: (error) => {
      clientLogger.error("Failed to update user", { error });
      toast.error("Failed to update user");
    },
  });
}
