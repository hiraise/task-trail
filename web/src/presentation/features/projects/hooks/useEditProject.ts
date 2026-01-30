"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { EditProjectPayload } from "@/application/payloads";
import type { ProjectDetails } from "@/domain/models/Project";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Hook for editing an existing project.
 *
 * @returns {UseMutationResult<ProjectDetails, Error, EditProjectPayload>}
 * A mutation object that handles project updates. On successful update:
 * - Updates the project query cache with the new project data
 * - Invalidates the project details query to refetch updated information
 * - Invalidates the projects list query to reflect changes
 *
 * @example
 * ```typescript
 * const editProjectMutation = useEditProject();
 * editProjectMutation.mutate({ id: 1, name: 'Updated Project' });
 * ```
 */
export function useEditProject(): UseMutationResult<ProjectDetails, Error, EditProjectPayload> {
  const queryClient = useQueryClient();
  const { editProject } = appContainer.usecases.project;

  return useMutation({
    mutationFn: (payload) => editProject(payload),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(QUERY_KEYS.project(updatedProject.id), updatedProject);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectDetails(updatedProject.id),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    },
  });
}
