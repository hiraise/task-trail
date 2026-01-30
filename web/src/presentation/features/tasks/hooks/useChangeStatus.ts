import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ChangeStatusPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * React Query mutation hook that updates a task's status.
 *
 * On success, invalidates task-related queries (task, taskDetails, and task-id scoped queries)
 * and shows a success toast. On failure, shows an error toast.
 *
 * @returns A React Query mutation result for updating task status.
 */
export function useChangeStatus(): UseMutationResult<Task, Error, ChangeStatusPayload> {
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
