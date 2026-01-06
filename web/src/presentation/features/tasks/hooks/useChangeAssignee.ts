import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ChangeAssigneeCommand } from "@/application/commands/task/ChangeAssigneeCommand";
import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook to change the assignee of a task using a mutation.
 *
 * This hook leverages React Query's `useMutation` to execute the `changeAssignee` use case.
 * On successful mutation, it updates the cached task data and invalidates the task details query,
 * ensuring UI consistency. It also provides user feedback via toast notifications on success or error.
 *
 * @returns {UseMutationResult<TaskResponseDto, Error, ChangeAssigneeCommand>}
 *   The mutation result object from React Query, including mutation methods and state.
 *
 * @example
 * const changeAssignee = useChangeAssignee();
 * changeAssignee.mutate({ taskId: '123', newAssigneeId: '456' });
 */
export function useChangeAssignee(): UseMutationResult<
  TaskResponseDto,
  Error,
  ChangeAssigneeCommand
> {
  const queryClient = useQueryClient();
  const { changeAssignee } = appContainer.getUsecases().tasks;

  return useMutation({
    mutationFn: (command) => changeAssignee.execute(command),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(updatedTask.id) });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.task(updatedTask.id), updatedTask.id],
      });
      toast.success("Assignee updated successfully");
    },
    onError: () => toast.error("Failed to change assignee"),
  });
}
