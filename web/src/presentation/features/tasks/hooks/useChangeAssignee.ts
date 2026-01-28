import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import type { ChangeAssigneePayload } from "@/application/payloads";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Hook for changing task assignee
 * @returns A mutation result object for executing the change assignee operation
 * @returns The mutation accepts a ChangeAssigneePayload and returns an updated TaskResponseDto
 * @remarks
 * - Invalidates task queries after successful assignee change
 * - Shows success toast on successful operation
 * - Shows error toast on failed operation
 * @example
 * const changeAssigneeMutation = useChangeAssignee();
 * changeAssigneeMutation.mutate({ taskId: '123', assigneeId: '456' });
 */
export function useChangeAssignee(): UseMutationResult<
  TaskResponseDto,
  Error,
  ChangeAssigneePayload
> {
  const queryClient = useQueryClient();
  const { changeAssignee } = appContainer.usecases.tasks;

  return useMutation({
    mutationFn: (payload) => changeAssignee(payload),
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
