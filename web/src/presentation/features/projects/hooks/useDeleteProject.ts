import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { ProjectId } from "@/domain/types";
import { projectRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { projectsTexts } from "@/shared/locales/projects";

/** Deletes the project (owner only), an archived one too, and goes to the project list. */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<void, Error, ProjectId>({
    mutationFn: (projectId) => projectRepository.delete(projectId),
    onError: (error) => toastError(error, projectsTexts.deleteProjectFailed),
    onSuccess: async (_, projectId) => {
      toast.success(projectsTexts.projectDeleted);
      await navigate({ to: ROUTES.projects, replace: true });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.invalidate.project(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.lists });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.mineLists });
      // Boards show the project and its tasks (ADR-0029)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.board.prefix });
    },
  });
}
