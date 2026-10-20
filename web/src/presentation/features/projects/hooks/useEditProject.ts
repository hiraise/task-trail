"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { EditProjectPayload } from "@/application/payloads";
import type { ProjectDetails } from "@/domain/models/Project";
import { logger } from "@/infrastructure/config/clientLogger";
import { projectRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

interface ProjectContext {
  previousProject: ProjectDetails | undefined;
  projectId: string;
}

/**
 * Custom React hook for editing project details with optimistic updates.
 *
 * This hook provides mutation functionality for updating project information including
 * name and description. It implements optimistic UI updates by immediately updating the
 * cache before the server response, and rolls back on error.
 *
 * @returns A mutation object from react-query that handles project updates with the following behavior:
 * - **onMutate**: Optimistically updates the project details in the query cache
 * - **onError**: Reverts to previous project state and displays error toast notification
 * - **onSuccess**: Invalidates projects list cache and displays success toast notification
 *
 * @example
 * ```typescript
 * const editProject = useEditProject();
 *
 * editProject.mutate({
 *   projectId: '123',
 *   name: 'New Project Name',
 *   description: 'Updated description'
 * });
 * ```
 */
export function useEditProject() {
  const queryClient = useQueryClient();

  return useMutation<ProjectDetails, Error, EditProjectPayload, ProjectContext>({
    mutationFn: (payload) =>
      projectRepository.update({
        projectId: payload.projectId,
        name: payload.name ?? "",
        description: payload.description,
      }),

    onMutate: async (payload) => {
      const previousProject = queryClient.getQueryData<ProjectDetails>(
        QUERY_KEYS.project.detail(payload.projectId),
      );

      queryClient.setQueryData<ProjectDetails>(
        QUERY_KEYS.project.detail(payload.projectId),
        (old) => {
          if (!old) return old;

          return {
            ...old,
            name: payload.name ?? old.name,
            description: payload.description ?? old.description,
          };
        },
      );

      return { previousProject, projectId: payload.projectId };
    },

    onError: (error, payload, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(
          QUERY_KEYS.project.detail(context.projectId),
          context.previousProject,
        );
      }
      logger.error("Error updating project", { projectId: payload.projectId, error, payload });
      toast.error(`Failed to update project: ${error.message}`);
    },

    onSuccess: (_, payload) => {
      logger.info("Project updated successfully", { projectId: payload.projectId });
      toast.success("Project updated successfully");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invalidate.project(payload.projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.all });
      // queryClient.invalidateQueries({ queryKey: ["project", payload.projectId] });
    },
  });
}
