"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { Project } from "@/domain/models/Project";
import type { ProjectId } from "@/domain/types";
import { logger } from "@/infrastructure/config/clientLogger";
import { projectRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

interface DeleteContext {
  previousProjects: Project[] | undefined;
  projectId: ProjectId;
}

/**
 * Custom hook for deleting a project with optimistic updates and error handling.
 *
 * @returns A mutation object from React Query that handles project deletion with:
 * - Optimistic UI updates by removing the project from cache before deletion
 * - Automatic rollback on error by restoring previous project data
 * - Success toast notification and navigation to projects list
 * - Error toast notification and logging on failure
 *
 * @example
 * ```tsx
 * const deleteProject = useDeleteProject();
 *
 * const handleDelete = () => {
 *   deleteProject.mutate(projectId);
 * };
 * ```
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<void, Error, ProjectId, DeleteContext>({
    mutationFn: projectRepository.delete,

    onMutate: async (projectId) => {
      const previousProjects = queryClient.getQueryData<Project[]>(QUERY_KEYS.project.all);

      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.project.all });
      await queryClient.cancelQueries({ queryKey: ["project", projectId] });

      queryClient.setQueryData<Project[]>(QUERY_KEYS.project.all, (old) => {
        if (!old) return old;

        return old.filter((project) => project.id !== projectId);
      });

      queryClient.removeQueries({ queryKey: ["project", projectId] });

      return { previousProjects, projectId };
    },

    onError: (error, projectId, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(QUERY_KEYS.project.all, context.previousProjects);
      }

      queryClient.invalidateQueries({ queryKey: ["project", projectId] });

      logger.error("Failed to delete project", {
        projectId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      toast.error(`Failed to delete project: ${error.message}`);
    },

    onSuccess: async (_, projectId) => {
      logger.info("Project deleted successfully", { projectId });
      toast.success("Project deleted successfully");

      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push(ROUTES.projects);
    },
  });
}
