import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { EditProjectPayload } from "@/application/payloads";
import type { ProjectDetails } from "@/domain/models/Project";
import { projectRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { projectsTexts } from "@/shared/locales/projects";

/**
 * Changes the name, description or key; the server responds with the updated project (ADR-0018).
 * A new key changes the keys of all project tasks (ADR-0026): everything that holds them is refetched.
 * A taken key is shown by the form under its field.
 */
export function useEditProject() {
  const queryClient = useQueryClient();

  return useMutation<ProjectDetails, Error, EditProjectPayload>({
    mutationFn: ({ projectId, ...changes }) => projectRepository.update(projectId, changes),
    onSuccess: (project, { key }) => {
      queryClient.setQueryData(QUERY_KEYS.project.detail(project.id), project);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.lists });
      if (key !== undefined) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invalidate.project(project.id) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.all });
        // Boards show project keys and task keys (ADR-0029)
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.board.prefix });
      }
      toast.success(projectsTexts.projectUpdated);
    },
    onError: (error) => {
      if (!hasErrorCode(error, "PROJECT_KEY_TAKEN")) toastError(error, projectsTexts.updateProjectFailed);
    },
  });
}
