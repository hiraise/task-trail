"use client";
import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { CreateProjectCommand } from "@/application/commands/project/CreateProjectCommand";
import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook to create a new project using a mutation.
 *
 * This hook leverages React Query's `useMutation` to execute the `createProject` use case.
 * On successful creation, it invalidates the projects list query and updates the cache for the newly created project.
 * On error, it logs the error to the console.
 *
 * @returns {UseMutationResult<ProjectResponseDto, Error, CreateProjectCommand>}
 *   The mutation result object from React Query, including mutation methods and state.
 */
export function useCreateProject(): UseMutationResult<
  ProjectResponseDto,
  Error,
  CreateProjectCommand
> {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { createProject } = appContainer.getUsecases().project;

  return useMutation({
    mutationFn: (command: CreateProjectCommand) => createProject.execute(command),
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
