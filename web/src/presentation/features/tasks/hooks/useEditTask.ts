"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { EditTaskCommand } from "@/application/commands/task/EditTaskCommand";
import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook for editing a task using a mutation.
 *
 * This hook leverages React Query's `useMutation` to execute the `editTask` use case.
 * On successful mutation, it updates the cached task data and invalidates relevant queries
 * to ensure fresh data is fetched. It also displays toast notifications for success or error.
 *
 * @returns {UseMutationResult<TaskResponseDto, Error, EditTaskCommand>} The mutation result object for editing a task.
 *
 * @example
 * const editTaskMutation = useEditTask();
 * editTaskMutation.mutate({ id: 1, title: "New Title" });
 */
export function useEditTask(): UseMutationResult<TaskResponseDto, Error, EditTaskCommand> {
  const queryClient = useQueryClient();
  const { editTask } = appContainer.getUsecases().tasks;

  return useMutation({
    mutationFn: (command: EditTaskCommand) => editTask.execute(command),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(QUERY_KEYS.task(updatedTask.id), updatedTask);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taskDetails(updatedTask.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(updatedTask.id) });
      toast.success("Task updated successfully");
    },
    onError: () => toast.error("Failed to edit task"),
  });
}
