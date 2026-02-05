import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { UpdateUserPayload } from "@/application/payloads";
import type { User } from "@/domain/models/User";
import { logger } from "@/infrastructure/config/clientLogger";
import { userRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to handle updating a user.
 *
 * This hook provides a mutation function to update a user's information
 * and manages the associated side effects such as invalidating the current
 * user query and displaying success or error notifications.
 *
 * @returns A mutation object from `useMutation` that includes:
 * - `mutate`: A function to trigger the mutation.
 * - `isLoading`: A boolean indicating if the mutation is in progress.
 * - `isError`: A boolean indicating if the mutation resulted in an error.
 * - `isSuccess`: A boolean indicating if the mutation was successful.
 * - Other properties provided by `useMutation`.
 *
 * @example
 * ```tsx
 * const { mutate: updateUser, isLoading } = useUpdateUser();
 *
 * const handleUpdate = () => {
 *   updateUser({ username: "newUsername" });
 * };
 * ```
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { updateUser } = userRepository;

  return useMutation<User, Error, UpdateUserPayload>({
    mutationFn: (payload) => updateUser(payload.username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.current });
      toast.success("User updated successfully");
    },
    onError: (error) => {
      logger.error("Failed to update user", { error });
      toast.error("Failed to update user");
    },
  });
}
