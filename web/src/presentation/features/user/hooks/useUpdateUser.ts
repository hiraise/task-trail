import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { UpdateUserCommand } from "@/application/commands/user/UpdateUserCommand";
import type { UserResponseDto } from "@/application/dto/UserResponseDto";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to update the current user using a mutation.
 *
 * Utilizes React Query's `useMutation` to execute the `updateUser` use case.
 * On successful update, invalidates the current user query and shows a success toast.
 * On error, logs the error and displays an error toast.
 *
 * @returns {UseMutationResult<UserResponseDto, Error, UpdateUserCommand>} Mutation result object for updating the user.
 */
export function useUpdateUser(): UseMutationResult<UserResponseDto, Error, UpdateUserCommand> {
  const queryClient = useQueryClient();
  const { updateUser } = appContainer.getUsecases().user;

  return useMutation({
    mutationFn: (command) => updateUser.execute(command),
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
