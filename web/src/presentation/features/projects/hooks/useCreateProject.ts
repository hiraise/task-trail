"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { CreateProjectPayload } from "@/application/payloads";
import { createProjectUseCase } from "@/application/usecases";
import type { ProjectDetails } from "@/domain/models/Project";
import { logger } from "@/infrastructure/config/clientLogger";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook for creating a new project with mutation handling.
 *
 * This hook wraps the project creation mutation and provides:
 * - Automatic cache updates on successful creation
 * - Navigation to the newly created project page
 * - Toast notifications for success/error states
 * - Query invalidation to refresh project lists
 * - Comprehensive logging of creation events and errors
 *
 * @returns A mutation object from `useMutation` with methods to trigger project creation
 *
 * @example
 * ```tsx
 * const createProject = useCreateProject();
 *
 * const handleCreate = () => {
 *   createProject.mutate({
 *     name: "New Project",
 *     description: "Project description"
 *   });
 * };
 * ```
 */
export function useCreateProject() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<ProjectDetails, Error, CreateProjectPayload>({
    mutationFn: (payload) => createProjectUseCase(payload),

    onSuccess: async (newProject) => {
      queryClient.setQueryData(QUERY_KEYS.project.detail(newProject.id), newProject);

      logger.info("Project created successfully", {
        projectId: newProject.id,
        name: newProject.name,
      });

      toast.success("Project created successfully");
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push(ROUTES.project(newProject.id));
    },

    onError: (error) => {
      logger.error("Failed to create project", { error, timestamp: new Date().toISOString() });

      toast.error(`Failed to create project: ${error.message}`);
    },
    onSettled: (newProject) => {
      if (newProject) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invalidate.project(newProject.id) });
      }
    },
  });
}
