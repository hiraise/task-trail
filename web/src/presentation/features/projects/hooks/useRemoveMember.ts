import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { RemoveMemberPayload } from "@/application/payloads";
import { removeProjectMemberUseCase } from "@/application/usecases";
import { logger } from "@/infrastructure/config/clientLogger";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to handle the removal of a member from a project.
 *
 * This hook provides a mutation function to remove a project member and handles
 * success and error scenarios by invalidating relevant queries and displaying
 * appropriate toast notifications.
 *
 * @returns {UseMutationResult<void, Error, RemoveMemberPayload>} A mutation object
 * that includes the mutation function and its state.
 *
 * @example
 * const { mutate: removeMember } = useRemoveMember();
 * removeMember({ projectId: '123', memberId: '456' });
 *
 * @remarks
 * - On success, invalidates the `projectMembers` and `projectDetails` queries for the given project.
 * - Displays a success toast message when the member is successfully removed.
 * - Logs an error and displays an error toast message if the removal fails.
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RemoveMemberPayload>({
    mutationFn: (payload) => removeProjectMemberUseCase(payload),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectMembers(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectDetails(projectId),
      });
      toast.success("Member kicked successfully");
    },
    onError: (_, { projectId }) => {
      logger.error(`Failed to kick member from project ${projectId}`);
      toast.error("Failed to kick member. Please try again.");
    },
  });
}
