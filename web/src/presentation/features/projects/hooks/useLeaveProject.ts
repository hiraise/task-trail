"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { LeaveProjectPayload } from "@/application/payloads";
import type { ProjectId } from "@/domain/types";
import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to handle leaving a project.
 *
 * This hook provides a mutation function to leave a project and manages
 * the associated side effects, such as updating the query cache and
 * navigating the user to the projects list upon success.
 *
 * @returns {UseMutationResult<ProjectId, Error, LeaveProjectPayload>}
 * An object containing the mutation state and functions to manage the
 * leave project operation.
 *
 * @example
 * const { mutate: leaveProject } = useLeaveProject();
 *
 * leaveProject({ projectId: 123 });
 */
export function useLeaveProject(): UseMutationResult<ProjectId, Error, LeaveProjectPayload> {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { leaveProject } = appContainer.usecases.projectMember;

  return useMutation({
    mutationFn: (payload) => leaveProject(payload),
    onSuccess: (_, result) => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.project(result.projectId) });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.projectDetails(result.projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      router.replace(ROUTES.projects);
      toast.success("You have left the project");
    },
    onError: () => toast.error("Failed to leave project. Please try again."),
  });
}
