import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { AddMembersPayload } from "@/application/payloads";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to add a member to a project.
 *
 * This hook utilizes a mutation to execute the add member operation.
 * On successful addition of a member, it invalidates the project members query
 * to ensure the UI reflects the latest data and displays a success toast notification.
 * In case of an error during the operation, an error toast notification is shown.
 *
 * @returns {UseMutationResult<void, Error, AddMembersPayload>} The mutation result object
 * containing the status and methods to manage the mutation.
 */
export function useAddMember(): UseMutationResult<void, Error, AddMembersPayload> {
  const queryClient = useQueryClient();
  const { addMember } = appContainer.usecases.projectMember;

  return useMutation({
    mutationFn: (payload) => addMember(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectMembers(variables.projectId),
      });
      toast.success("User invited successfully!");
    },
    onError: () => toast.error("Failed to invite user"),
  });
}
