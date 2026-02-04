import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { AddMembersPayload } from "@/application/payloads";
import { addProjectMembersUseCase } from "@/application/usecases";
import { logger } from "@/infrastructure/config/clientLogger";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to handle adding members to a project.
 *
 * This hook provides a mutation function to add members to a project
 * and manages the success, error, and settled states of the mutation.
 *
 * @returns A mutation object from `useMutation` that can be used to trigger
 * the add member operation and track its state.
 *
 * @example
 * const { mutate: addMember, isLoading, isError } = useAddMember();
 *
 * addMember({
 *   projectId: "project-id",
 *   emails: ["user1@example.com", "user2@example.com"]
 * });
 *
 * @remarks
 * - On success, a success toast is displayed with the number of users invited.
 * - On error, an error toast is displayed indicating the failure.
 * - On settled (success or error), the project members query is invalidated
 *   to ensure the data is up-to-date.
 *
 * @see {@link useMutation} for more details on the mutation object.
 * @see {@link QUERY_KEYS.projectMembers} for the query key used to invalidate the cache.
 */
export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, AddMembersPayload>({
    mutationFn: (payload) => addProjectMembersUseCase(payload),
    onSuccess: (_, { emails }) => {
      const count = emails.length;

      toast.success(`${count} user${count > 1 ? "s" : ""} invited successfully!`);
    },
    onError: () => {
      logger.error("Failed to invite user to project");
      toast.error("Failed to invite user");
    },
    onSettled: (_, __, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectMembers(projectId) });
    },
  });
}
