"use client";
import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import type { CreateProjectPayload } from "@/application/payloads";
import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Hook for creating a new project.
 *
 * @returns {UseMutationResult<ProjectResponseDto, Error, CreateProjectPayload>}
 * A mutation result object with the following behavior:
 * - On success: Invalidates the projects query cache, sets the new project in cache,
 *   navigates to the project detail page, and displays a success toast notification
 * - On error: Displays an error toast notification
 *
 * @example
 * const createProjectMutation = useCreateProject();
 *
 * createProjectMutation.mutate({
 *   name: "My Project",
 *   description: "Project description"
 * });
 */
export function useCreateProject(): UseMutationResult<
  ProjectResponseDto,
  Error,
  CreateProjectPayload
> {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { createProject } = appContainer.usecases.project;

  return useMutation({
    mutationFn: (payload) => createProject(payload),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      queryClient.setQueryData(QUERY_KEYS.project(Number(newProject.id)), newProject);
      if (newProject) router.push(ROUTES.project(Number(newProject.id)));
      toast.success("Project created successfully");
    },
    onError: () => {
      toast.error("Failed to create project. Please try again");
    },
  });
}
