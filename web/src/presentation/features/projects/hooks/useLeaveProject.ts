import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { LeaveProjectPayload } from "@/application/payloads";
import { projectMemberRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { projectsTexts } from "@/shared/locales/projects";

/** Leaves the project (admin or member; owner — OWNER_CANNOT_LEAVE). */
export function useLeaveProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<void, Error, LeaveProjectPayload>({
    mutationFn: ({ projectId }) => projectMemberRepository.leaveProject(projectId),
    onSuccess: (_, { projectId }) => {
      toast.success(projectsTexts.projectLeft);
      navigate({ to: ROUTES.projects, replace: true });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.invalidate.project(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.lists });
      // Leaving clears the user as the assignee of the project's tasks
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.mineLists });
    },
    onError: (error) => toastError(error, projectsTexts.leaveProjectFailed),
  });
}
