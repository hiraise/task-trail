"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { EditProjectCommand } from "@/application/commands/project/EditProjectCommand";
import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook to handle editing a project using a mutation.
 *
 * This hook leverages React Query's `useMutation` to execute the `editProject` use case.
 * On successful mutation, it updates the cached project data and invalidates the projects list query
 * to ensure the UI reflects the latest changes.
 *
 * @returns {UseMutationResult<ProjectResponseDto, Error, EditProjectCommand>}
 *   The mutation result object for editing a project.
 *
 * @example
 * const editProjectMutation = useEditProject();
 * editProjectMutation.mutate({ id: 1, name: "New Name" });
 */
export function useEditProject(): UseMutationResult<ProjectResponseDto, Error, EditProjectCommand> {
  const queryClient = useQueryClient();
  const { editProject } = appContainer.getUsecases().project;

  return useMutation({
    mutationFn: (command: EditProjectCommand) => editProject.execute(command),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(QUERY_KEYS.project(Number(updatedProject.id)), updatedProject);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectDetails(Number(updatedProject.id)),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    },
  });
}
