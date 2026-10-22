import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { EditProjectPayload } from "@/application/payloads";
import type { ProjectDetails } from "@/domain/models/Project";
import { projectRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { projectsTexts } from "@/shared/locales/projects";

/** Changes the name or description; the server responds with the updated project (ADR-0018). */
export function useEditProject() {
  const queryClient = useQueryClient();

  return useMutation<ProjectDetails, Error, EditProjectPayload>({
    mutationFn: ({ projectId, ...changes }) => projectRepository.update(projectId, changes),
    onSuccess: (project) => {
      queryClient.setQueryData(QUERY_KEYS.project.detail(project.id), project);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.all });
      toast.success(projectsTexts.projectUpdated);
    },
    onError: (error) => toastError(error, projectsTexts.updateProjectFailed),
  });
}
