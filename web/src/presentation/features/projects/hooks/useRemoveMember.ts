import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { RemoveMemberPayload } from "@/application/payloads";
import { removeProjectMemberUseCase } from "@/application/usecases";
import { logger } from "@/infrastructure/config/clientLogger";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook for removing a member from a project.
 *
 * This hook uses React Query's `useMutation` to handle the removal of a project member.
 * On successful removal, it invalidates the project members and project detail queries
 * to ensure the UI reflects the updated state, and displays a success toast notification.
 *
 * @returns A mutation object from `useMutation` that can be used to trigger the member removal operation.
 *
 * @example
 * ```typescript
 * const removeMember = useRemoveMember();
 *
 * removeMember.mutate({
 *   projectId: '123',
 *   memberId: '456'
 * });
 * ```
 *
 * @remarks
 * - Invalidates `project.members` and `project.detail` queries after successful removal
 * - Displays success toast message: "Member kicked successfully"
 * - Displays error toast message: "Failed to kick member. Please try again."
 * - Logs errors using the logger service
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RemoveMemberPayload>({
    mutationFn: (payload) => removeProjectMemberUseCase(payload),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.project.members(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.project.detail(projectId),
      });
      toast.success("Member kicked successfully");
    },
    onError: (_, { projectId }) => {
      logger.error(`Failed to kick member from project ${projectId}`);
      toast.error("Failed to kick member. Please try again.");
    },
  });
}
