import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ProjectDetails } from "@/domain/models/Project";
import type { ProjectId } from "@/domain/types";
import { projectRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { projectsTexts } from "@/shared/locales/projects";

interface SetProjectArchivedPayload {
  projectId: ProjectId;
  archived: boolean;
}

/**
 * Archives or restores a project, owner only (ADR-0027). Its tasks become read-only or editable
 * again: project lists, the project's task lists, task pages and "My tasks" are refetched.
 */
export function useSetProjectArchived() {
  const queryClient = useQueryClient();

  return useMutation<ProjectDetails, Error, SetProjectArchivedPayload>({
    mutationFn: ({ projectId, archived }) => projectRepository.setArchived(projectId, archived),
    onSuccess: (project, { archived }) => {
      queryClient.setQueryData(QUERY_KEYS.project.detail(project.id), project);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invalidate.project(project.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.lists });
      // Task pages carry projectArchived; the prefix covers "My tasks" too
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.all });
      toast.success(archived ? projectsTexts.projectArchived : projectsTexts.projectRestored);
    },
    onError: (error, { archived }) =>
      toastError(
        error,
        archived ? projectsTexts.archiveProjectFailed : projectsTexts.restoreProjectFailed,
      ),
  });
}
