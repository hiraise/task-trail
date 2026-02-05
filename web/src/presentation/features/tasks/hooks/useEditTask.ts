"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { EditTaskPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import type { TaskId } from "@/domain/types";
import { logger } from "@/infrastructure/config/clientLogger";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

interface TaskContext {
  previousTask: Task | undefined;
  taskId: TaskId;
}

/**
 * Custom hook for editing/updating a task with optimistic updates and error handling.
 *
 * @remarks
 * This hook uses React Query's `useMutation` to handle task updates with the following features:
 * - Optimistic updates: immediately updates the task in the cache before the API call completes
 * - Error recovery: rolls back to the previous task state if the update fails
 * - Cache invalidation: refreshes the tasks list after successful update
 * - User feedback: displays toast notifications for success and error states
 * - Logging: tracks update operations for debugging and monitoring
 *
 * @returns A mutation object from React Query with methods to trigger the task update
 *
 * @example
 * ```tsx
 * const editTask = useEditTask();
 *
 * editTask.mutate({
 *   taskId: '123',
 *   title: 'Updated Task Title',
 *   description: 'Updated description'
 * });
 * ```
 */
export function useEditTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, EditTaskPayload, TaskContext>({
    mutationFn: (payload) => taskRepository.update(payload),
    onMutate: async (payload) => {
      const previousTask = queryClient.getQueryData<Task>(QUERY_KEYS.task.detail(payload.taskId));

      queryClient.setQueryData<Task>(QUERY_KEYS.task.detail(payload.taskId), (old) => {
        if (!old) return old;

        return {
          ...old,
          name: payload.title ?? old.name,
          description: payload.description ?? old.description,
        };
      });

      return { previousTask, taskId: payload.taskId };
    },
    onError: (error, payload, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(QUERY_KEYS.task.detail(context.taskId), context.previousTask);
      }
      logger.error("Error updating task", { taskId: payload.taskId, error, payload });
      toast.error(`Failed to update task: ${error.message}`);
    },
    onSuccess: (updatedTask, payload) => {
      logger.info("Task updated successfully", { taskId: payload.taskId });
      toast.success("Task updated successfully");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.detail(payload.taskId) });
    },
  });
}
