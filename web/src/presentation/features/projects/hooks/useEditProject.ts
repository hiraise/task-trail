"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import type { EditProjectPayload } from "@/application/payloads";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Hook for editing an existing project.
 *
 * @returns {UseMutationResult<ProjectResponseDto, Error, EditProjectPayload>}
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
export function useEditProject(): UseMutationResult<ProjectResponseDto, Error, EditProjectPayload> {
  const queryClient = useQueryClient();
  const { editProject } = appContainer.getUsecases().project;

  return useMutation({
    mutationFn: (payload) => editProject.execute(payload),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(QUERY_KEYS.project(Number(updatedProject.id)), updatedProject);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectDetails(Number(updatedProject.id)),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    },
  });
}
