import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { AddProjectMembersCommand } from "@/application/commands/projectMember/AddProjectMembersCommand";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook to add a member to a project using a mutation.
 *
 * This hook leverages React Query's `useMutation` to execute the `addMember` use case,
 * which sends an invitation to a user to join a project. Upon successful mutation,
 * it invalidates the project members query cache for the relevant project and displays
 * a success toast notification. If the mutation fails, it displays an error toast notification.
 *
 * @returns {UseMutationResult<void, Error, AddProjectMembersCommand>} The mutation result object,
 * allowing you to trigger the add member operation and track its status.
 */
export function useAddMember(): UseMutationResult<void, Error, AddProjectMembersCommand> {
  const queryClient = useQueryClient();
  const { addMember } = appContainer.getUsecases().projectMember;

  return useMutation({
    mutationFn: (command) => addMember.execute(command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectMembers(Number(variables.projectId)),
      });
      toast.success("User invited successfully!");
    },
    onError: () => toast.error("Failed to invite user"),
  });
}
