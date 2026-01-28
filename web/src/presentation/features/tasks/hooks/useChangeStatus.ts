import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import type { ChangeStatusPayload } from "@/application/payloads";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Hook for changing the status of a task.
 *
 * Manages the mutation state for updating a task's status and automatically
 * invalidates related cache queries upon successful update. Displays success/error
 * toast notifications to the user.
 *
 * @returns {UseMutationResult<TaskResponseDto, Error, ChangeStatusPayload>}
 * A mutation result object with the following properties:
 * - `mutate`: Function to trigger the status change with a ChangeStatusPayload
 * - `mutateAsync`: Async version of mutate
 * - `isPending`: Loading state during mutation
 * - `isError`: Whether the mutation failed
 * - `isSuccess`: Whether the mutation succeeded
 * - `data`: The updated task response
 * - `error`: Error object if mutation failed
 *
 * @example
 * const changeStatusMutation = useChangeStatus();
 * changeStatusMutation.mutate({ taskId: '123', status: 'completed' });
 */
export function useChangeStatus(): UseMutationResult<TaskResponseDto, Error, ChangeStatusPayload> {
  const queryClient = useQueryClient();
  const { changeStatus } = appContainer.usecases.tasks;

  return useMutation({
    mutationFn: (payload) => changeStatus(payload),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(updatedTask.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taskDetails(updatedTask.id) });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.task(updatedTask.id), updatedTask.id],
      });
      toast.success("Task status updated successfully");
    },
    onError: () => toast.error("Failed to update status"),
  });
}
