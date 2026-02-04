"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ChangeAssigneePayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import { logger } from "@/infrastructure/config/clientLogger";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

interface ChangeAssigneeContext {
  previousTask: Task | undefined;
  previousTaskDetails: Task | undefined;
  taskId: string;
}

/**
 * Custom hook for changing the assignee of a task with optimistic updates.
 *
 * This hook provides a mutation function that updates a task's assignee both optimistically
 * (immediately updating the UI) and on the server. It handles rollback on errors and
 * invalidates relevant queries on completion.
 *
 * @returns A mutation object from React Query with methods to change a task's assignee
 *
 * @example
 * ```tsx
 * const changeAssigneeMutation = useChangeAssignee();
 *
 * changeAssigneeMutation.mutate({
 *   taskId: '123',
 *   assigneeId: 'user-456'
 * });
 * ```
 *
 * @remarks
 * - Performs optimistic updates to both task and taskDetails queries
 * - Automatically rolls back changes if the server request fails
 * - Shows toast notifications for success and error states
 * - Logs all operations for debugging purposes
 * - Invalidates affected queries after the mutation settles
 */
export function useChangeAssignee() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, ChangeAssigneePayload, ChangeAssigneeContext>({
    mutationFn: (payload) => taskRepository.changeAssignee(payload),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.task(payload.taskId) });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.taskDetails(payload.taskId) });

      const previousTask = queryClient.getQueryData<Task>(QUERY_KEYS.task(payload.taskId));
      const previousTaskDetails = queryClient.getQueryData<Task>(
        QUERY_KEYS.taskDetails(payload.taskId),
      );

      const optimisticUpdate = (old: Task | undefined) => {
        if (!old) return old;

        return {
          ...old,
          assigneeId: payload.assigneeId ?? undefined,
          updatedAt: new Date().toISOString(),
        };
      };

      queryClient.setQueryData<Task>(QUERY_KEYS.task(payload.taskId), optimisticUpdate);
      queryClient.setQueryData<Task>(QUERY_KEYS.taskDetails(payload.taskId), optimisticUpdate);

      return {
        previousTask,
        previousTaskDetails,
        taskId: payload.taskId,
      };
    },

    onError: (error, payload, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(QUERY_KEYS.task(context.taskId), context.previousTask);
      }
      if (context?.previousTaskDetails) {
        queryClient.setQueryData(
          QUERY_KEYS.taskDetails(context.taskId),
          context.previousTaskDetails,
        );
      }

      logger.error("Failed to change assignee", {
        taskId: payload.taskId,
        assigneeId: payload.assigneeId,
        error,
        timestamp: new Date().toISOString(),
      });

      toast.error(`Failed to change assignee: ${error.message}`);
    },

    onSuccess: (updatedTask, payload) => {
      logger.info("Assignee changed successfully", {
        taskId: payload.taskId,
        assigneeId: payload.assigneeId,
      });

      toast.success("Assignee updated successfully");
    },

    onSettled: (_, __, payload) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(payload.taskId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taskDetails(payload.taskId) });
    },
  });
}
