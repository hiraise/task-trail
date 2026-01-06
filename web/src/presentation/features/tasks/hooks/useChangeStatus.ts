import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ChangeStatusCommand } from "@/application/commands/task/ChangeStatusCommand";
import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook that provides a mutation for changing the status of a task.
 *
 * Utilizes React Query's `useMutation` to execute the `changeStatus` use case,
 * and handles cache invalidation for the updated task upon success.
 * Displays toast notifications for both success and error outcomes.
 *
 * @returns {UseMutationResult<TaskResponseDto, Error, ChangeStatusCommand>}
 *   The mutation result object for changing a task's status.
 */
export function useChangeStatus(): UseMutationResult<TaskResponseDto, Error, ChangeStatusCommand> {
  const queryClient = useQueryClient();
  const { changeStatus } = appContainer.getUsecases().tasks;

  return useMutation({
    mutationFn: (command) => changeStatus.execute(command),
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
