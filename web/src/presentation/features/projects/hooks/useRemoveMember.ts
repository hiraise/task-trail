import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { RemoveMemberPayload } from "@/application/payloads";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to remove a member from a project.
 *
 * This hook utilizes a mutation to execute the removal of a project member.
 * On successful removal, it invalidates the queries for the project members
 * and project details to ensure the UI reflects the latest state. It also
 * displays a success message using a toast notification. In case of an error,
 * an error message is shown to the user.
 *
 * @returns {UseMutationResult<void, Error, RemoveMemberPayload>} The mutation result
 * which includes methods and properties to manage the mutation state.
 */
export function useRemoveMember(): UseMutationResult<void, Error, RemoveMemberPayload> {
  const queryClient = useQueryClient();
  const { removeMember } = appContainer.usecases.projectMember;

  return useMutation({
    mutationFn: (payload) => removeMember(payload),
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
