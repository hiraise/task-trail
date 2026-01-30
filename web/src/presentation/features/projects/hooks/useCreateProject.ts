"use client";
import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { CreateProjectPayload } from "@/application/payloads";
import type { ProjectDetails } from "@/domain/models/Project";
import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Hook for creating a new project.
 *
 * @returns {UseMutationResult<ProjectDetails, Error, CreateProjectPayload>}
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
export function useCreateProject(): UseMutationResult<ProjectDetails, Error, CreateProjectPayload> {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { createProject } = appContainer.usecases.project;

  return useMutation({
    mutationFn: (payload) => createProject(payload),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      queryClient.setQueryData(QUERY_KEYS.project(newProject.id), newProject);
      if (newProject) router.push(ROUTES.project(newProject.id));
      toast.success("Project created successfully");
    },
    onError: () => {
      toast.error("Failed to create project. Please try again");
    },
  });
}
