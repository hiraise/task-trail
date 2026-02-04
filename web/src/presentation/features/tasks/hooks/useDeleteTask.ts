"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { Task } from "@/domain/models/Task";
import type { ProjectId, TaskId } from "@/domain/types";
import { logger } from "@/infrastructure/config/clientLogger";
import { taskRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

interface DeleteTaskContext {
  previousTask: Task | undefined;
  previousTaskDetails: Task | undefined;
  previousTasks: Task[] | undefined;
  taskId: TaskId;
  projectId: ProjectId;
}

/**
 * Custom hook for deleting a task with optimistic updates and error handling.
 *
 * Implements optimistic UI updates by immediately removing the task from the cache
 * before the server request completes. If the deletion fails, the previous state
 * is restored.
 *
 * @param projectId - The ID of the project containing the task to delete
 *
 * @returns A mutation object from React Query with the following behavior:
 * - `mutationFn`: Calls the task repository to delete the task
 * - `onMutate`: Cancels related queries, stores previous state, and optimistically removes the task
 * - `onSuccess`: Logs success, shows success toast, and redirects to project page after 300ms delay
 * - `onError`: Restores previous state, logs error details, and shows error toast
 *
 * @example
 * ```typescript
 * const deleteTask = useDeleteTask(projectId);
 * deleteTask.mutate(taskId);
 * ```
 */
export function useDeleteTask(projectId: ProjectId) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<void, Error, TaskId, DeleteTaskContext>({
    mutationFn: (taskId) => taskRepository.delete(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.task(taskId) });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.taskDetails(taskId) });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.projectTasks(projectId) });

      const previousTask = queryClient.getQueryData<Task>(QUERY_KEYS.task(taskId));
      const previousTaskDetails = queryClient.getQueryData<Task>(QUERY_KEYS.taskDetails(taskId));
      const previousTasks = queryClient.getQueryData<Task[]>(QUERY_KEYS.projectTasks(projectId));

      queryClient.removeQueries({ queryKey: QUERY_KEYS.task(taskId) });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.taskDetails(taskId) });

      queryClient.setQueryData<Task[]>(QUERY_KEYS.projectTasks(projectId), (old) =>
        old?.filter((task) => task.id !== taskId),
      );

      return {
        previousTask,
        previousTaskDetails,
        previousTasks,
        taskId,
        projectId,
      };
    },
    onSuccess: async (_, taskId) => {
      logger.info("Task deleted successfully", { taskId, projectId });

      toast.success("Task deleted successfully");

      await new Promise((resolve) => setTimeout(resolve, 300));
      router.replace(ROUTES.project(projectId));
    },
    onError: (error, taskId, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(QUERY_KEYS.task(context.taskId), context.previousTask);
      }
      if (context?.previousTaskDetails) {
        queryClient.setQueryData(
          QUERY_KEYS.taskDetails(context.taskId),
          context.previousTaskDetails,
        );
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(QUERY_KEYS.projectTasks(context.projectId), context.previousTasks);
      }

      logger.error("Failed to delete task", {
        taskId,
        projectId: context?.projectId,
        error,
        timestamp: new Date().toISOString(),
      });

      toast.error(`Failed to delete task: ${error.message}`);
    },
  });
}
