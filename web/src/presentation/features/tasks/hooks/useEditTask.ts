"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { TaskDetailResponseDto } from "@/application/dto/TaskDetailResponseDto";
import type { EditTaskPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import type { TaskId } from "@/domain/types";
import { logger } from "@/infrastructure/config/clientLogger";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

interface TaskContext {
  previousTask: TaskDetailResponseDto | undefined;
  taskId: TaskId;
}

/**
 * A hook for editing a task with optimistic updates and error handling.
 *
 * This hook uses React Query's mutation functionality to:
 * - Perform optimistic updates on the task detail query cache
 * - Rollback changes on error
 * - Invalidate related queries on success
 * - Provide user feedback via logging and toast notifications
 *
 * @returns {UseMutationResult<void, Error, EditTaskPayload, TaskContext>} A mutation object with the following:
 *   - `mutate` or `mutateAsync`: Function to trigger the task update with `EditTaskPayload`
 *   - `isLoading`: Boolean indicating if the mutation is in progress
 *   - `isError`: Boolean indicating if the mutation failed
 *   - `error`: The error object if the mutation failed
 *   - `data`: undefined (mutation returns void)
 *
 * @example
 * const editTaskMutation = useEditTask();
 *
 * editTaskMutation.mutate({
 *   taskId: '123',
 *   title: 'Updated Title',
 *   description: 'Updated Description'
 * });
 */
export function useEditTask() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, EditTaskPayload, TaskContext>({
    mutationFn: (payload) => taskRepository.update(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.task.detail(payload.taskId) });

      const previousTask = queryClient.getQueryData<TaskDetailResponseDto>(
        QUERY_KEYS.task.detail(payload.taskId),
      );

      queryClient.setQueryData<TaskDetailResponseDto>(
        QUERY_KEYS.task.detail(payload.taskId),
        (old) => {
          if (!old) return old;

          const { assignee, project, status, task } = old;

          const updatedTask: Task = {
            ...task,
            name: payload.title ?? task.name,
            description: payload.description ?? task.description,
            updatedAt: new Date().toISOString(),
          };

          return { assignee, project, status, task: updatedTask };
        },
      );

      return { previousTask, taskId: payload.taskId };
    },
    onError: (error, payload, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(QUERY_KEYS.task.detail(context.taskId), context.previousTask);
      }
      logger.error("Error updating task", {
        taskId: payload.taskId,
        error: error.message,
        payload,
      });
      toast.error(`Failed to update task: ${error.message}`);
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.task.detail(payload.taskId),
        refetchType: "active",
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.task.all,
        refetchType: "active",
      });

      logger.info("Task updated successfully", { taskId: payload.taskId });
      toast.success("Task updated successfully");
    },
  });
}
