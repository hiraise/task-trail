import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ChangeStatusPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import { logger } from "@/infrastructure/config/clientLogger";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

interface ChangeStatusContext {
  previousTask: Task | undefined;
  previousTaskDetails: Task | undefined;
  taskId: string;
}

/**
 * Custom hook for changing the status of a task with optimistic updates.
 *
 * This hook uses React Query's `useMutation` to handle status changes while providing
 * optimistic UI updates. It automatically updates the task cache before the server responds,
 * and rolls back changes if the mutation fails.
 *
 * @returns A mutation object from React Query that can be used to trigger status changes.
 * The mutation accepts a `ChangeStatusPayload` containing the task ID and new status ID.
 *
 * @remarks
 * The hook implements the following behavior:
 * - **Optimistic Updates**: Immediately updates both task and task details queries in the cache
 * - **Error Handling**: Automatically reverts optimistic updates and shows error toast on failure
 * - **Success Feedback**: Displays success toast and logs the operation
 * - **Cache Invalidation**: Invalidates relevant queries after mutation settles to ensure data consistency
 *
 * @example
 * ```typescript
 * const changeStatusMutation = useChangeStatus();
 *
 * changeStatusMutation.mutate({
 *   taskId: '123',
 *   statusId: 'completed'
 * });
 * ```
 */
export function useChangeStatus() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, ChangeStatusPayload, ChangeStatusContext>({
    mutationFn: (payload) => taskRepository.changeStatus(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.task.all });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.task.detail(payload.taskId) });

      const previousTask = queryClient.getQueryData<Task>(QUERY_KEYS.task.detail(payload.taskId));
      const previousTaskDetails = queryClient.getQueryData<Task>(
        QUERY_KEYS.task.detail(payload.taskId),
      );

      const optimisticUpdate = (old: Task | undefined) => {
        if (!old) return old;

        return {
          ...old,
          statusId: payload.statusId ?? undefined,
          updatedAt: new Date().toISOString(),
        };
      };

      queryClient.setQueryData<Task>(QUERY_KEYS.task.detail(payload.taskId), optimisticUpdate);

      return {
        previousTask,
        previousTaskDetails,
        taskId: payload.taskId,
      };
    },

    onError: (error, payload, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(QUERY_KEYS.task.detail(context.taskId), context.previousTask);
      }
      if (context?.previousTaskDetails) {
        queryClient.setQueryData(
          QUERY_KEYS.task.detail(context.taskId),
          context.previousTaskDetails,
        );
      }

      logger.error("Failed to change status", {
        taskId: payload.taskId,
        statusId: payload.statusId,
        error,
        timestamp: new Date().toISOString(),
      });

      toast.error(`Failed to change status: ${error.message}`);
    },

    onSuccess: (updatedTask, payload) => {
      logger.info("Status changed successfully", {
        taskId: payload.taskId,
        statusId: payload.statusId,
      });

      toast.success("Status updated successfully");
    },

    onSettled: (_, __, payload) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.detail(payload.taskId) });
    },
  });
}
