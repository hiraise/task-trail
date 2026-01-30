"use client";
import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ProjectId } from "@/domain/types";
import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook to handle the deletion of a project.
 *
 * This hook returns a mutation object from React Query that, when triggered,
 * deletes a project by its ID. On successful deletion, it navigates the user
 * back to the projects list, displays a success toast notification, removes
 * the deleted project's query from the cache, and invalidates the projects list query.
 * On error, it displays an error toast notification.
 *
 * @returns {UseMutationResult<void, Error, ProjectId>} A mutation object for deleting a project.
 */
export function useDeleteProject(): UseMutationResult<void, Error, ProjectId> {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { deleteProject } = appContainer.usecases.project;

  return useMutation({
    mutationFn: (projectId: ProjectId) => deleteProject(projectId),
    onSuccess: (_, projectId) => {
      router.replace(ROUTES.projects);
      toast.success("Project deleted successfully");
      queryClient.removeQueries({ queryKey: QUERY_KEYS.project(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    },
    onError: () => toast.error("Failed to delete project. Please try again."),
  });
}
