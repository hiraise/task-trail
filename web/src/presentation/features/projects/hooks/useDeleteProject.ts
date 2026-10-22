import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { Project } from "@/domain/models/Project";
import type { ProjectId } from "@/domain/types";
import { projectRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { projectsTexts } from "@/shared/locales/projects";

interface DeleteContext {
  previousProjects: Project[] | undefined;
}

/** Deletes the project (owner only): removes it from the list at once, restores it on error. */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<void, Error, ProjectId, DeleteContext>({
    mutationFn: (projectId) => projectRepository.delete(projectId),

    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.project.all });
      const previousProjects = queryClient.getQueryData<Project[]>(QUERY_KEYS.project.all);

      queryClient.setQueryData<Project[]>(QUERY_KEYS.project.all, (projects) =>
        projects?.filter((project) => project.id !== projectId),
      );

      return { previousProjects };
    },

    onError: (error, _, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(QUERY_KEYS.project.all, context.previousProjects);
      }
      toastError(error, projectsTexts.deleteProjectFailed);
    },

    onSuccess: (_, projectId) => {
      toast.success(projectsTexts.projectDeleted);
      navigate({ to: ROUTES.projects, replace: true });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.invalidate.project(projectId) });
    },
  });
}
