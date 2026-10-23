import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { RemoveMemberPayload } from "@/application/payloads";
import { projectMemberRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { projectsTexts } from "@/shared/locales/projects";

/** Removes a member; their tasks in the project are left unassigned. */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RemoveMemberPayload>({
    mutationFn: ({ projectId, memberId }) =>
      projectMemberRepository.removeMember(projectId, memberId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invalidate.project(projectId) });
      // The member's tasks are unassigned: assignees and histories of many tasks changed (ADR-0028)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.all });
      // Boards show the project and its tasks (ADR-0029)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.board.prefix });
      toast.success(projectsTexts.memberRemoved);
    },
    onError: (error) => toastError(error, projectsTexts.removeMemberFailed),
  });
}
