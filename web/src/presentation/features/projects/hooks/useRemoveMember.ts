import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { RemoveProjectMemberCommand } from "@/application/commands/projectMember/RemoveProjectMemberCommand";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook to remove (kick) a member from a project.
 *
 * This hook returns a mutation object that can be used to trigger the removal of a project member
 * by executing the `removeMember` use case. Upon successful removal, it invalidates the project members
 * query cache and displays a success toast notification. If the operation fails, an error toast is shown.
 *
 * @param id - The unique identifier of the project whose member is to be removed.
 * @returns A mutation result object from `react-query` for managing the remove member operation.
 */
export function useRemoveMember(): UseMutationResult<void, Error, RemoveProjectMemberCommand> {
  const queryClient = useQueryClient();
  const { removeMember } = appContainer.getUsecases().projectMember;

  return useMutation({
    mutationFn: (command) => removeMember.execute(command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectMembers(Number(variables.memberId)),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectDetails(Number(variables.projectId)),
      });
      toast.success("Member kicked successfully");
    },
    onError: () => toast.error("Failed to kick member. Please try again."),
  });
}
