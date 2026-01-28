"use client";
import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook to handle deletion of a task within a project.
 *
 * This hook provides a mutation for deleting a task by its ID, handles optimistic UI updates,
 * and displays success or error toasts based on the result. Upon successful deletion, it navigates
 * back to the project page, removes relevant cached queries, and invalidates the project tasks query.
 *
 * @param projectId - The ID of the project containing the task to be deleted.
 * @returns A mutation result object from React Query for deleting a task.
 *
 * @example
 * const deleteTaskMutation = useDeleteTask(projectId);
 * deleteTaskMutation.mutate(taskId);
 */
export function useDeleteTask(projectId: number): UseMutationResult<void, Error, string | number> {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { deleteTask } = appContainer.usecases.tasks;

  return useMutation({
    mutationFn: (taskId: string | number) => deleteTask(taskId),
    onSuccess: (_, taskId) => {
      router.replace(ROUTES.project(projectId));
      toast.success("Task deleted successfully");
      queryClient.removeQueries({ queryKey: QUERY_KEYS.task(Number(taskId)) });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.taskDetails(Number(taskId)) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(projectId) });
    },
    onError: () => toast.error("Failed to delete task. Please try again."),
  });
}
