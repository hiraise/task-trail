"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { LeaveProjectCommand } from "@/application/commands/projectMember/LeaveProjectCommand";
import type { ProjectId } from "@/domain/valueobjects/ProjectId";
import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export function useLeaveProject(): UseMutationResult<ProjectId, Error, LeaveProjectCommand> {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { leaveProject } = appContainer.getUsecases().projectMember;

  return useMutation({
    mutationFn: (command) => leaveProject.execute(command),
    onSuccess: (_, result) => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.project(Number(result.projectId)) });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.projectDetails(Number(result.projectId)) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      router.replace(ROUTES.projects);
      toast.success("You have left the project");
    },
    onError: () => toast.error("Failed to leave project. Please try again."),
  });
}
