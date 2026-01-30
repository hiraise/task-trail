"use client";
import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ProjectId, TaskId } from "@/domain/types";
import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * React Query mutation hook to delete a task and synchronize related caches.
 *
 * @param projectId - The project identifier used to scope navigation and cache invalidation.
 * @returns A mutation result for deleting a task by its id.
 *
 * @remarks
 * On success, it navigates back to the project view, shows a success toast,
 * removes the task and task details queries, and invalidates the project's task list.
 * On error, it shows a failure toast.
 */
export function useDeleteTask(projectId: ProjectId): UseMutationResult<void, Error, TaskId> {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { deleteTask } = appContainer.usecases.tasks;

  return useMutation({
    mutationFn: (taskId) => deleteTask(taskId),
    onSuccess: (_, taskId) => {
      router.replace(ROUTES.project(projectId));
      toast.success("Task deleted successfully");
      queryClient.removeQueries({ queryKey: QUERY_KEYS.task(taskId) });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.taskDetails(taskId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(projectId) });
    },
    onError: () => toast.error("Failed to delete task. Please try again."),
  });
}
