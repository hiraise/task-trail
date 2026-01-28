"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import type { EditTaskPayload } from "@/application/payloads";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to handle the editing of a task.
 *
 * This hook utilizes the `useMutation` from React Query to perform the task editing operation.
 * It provides a mutation function that executes the edit task use case and manages the success
 * and error states of the operation.
 *
 * On successful task edit, it updates the query cache with the new task data and invalidates
 * related queries to ensure that the UI reflects the latest data. A success toast notification
 * is displayed to inform the user of the successful update.
 *
 * On error, an error toast notification is displayed to inform the user of the failure.
 *
 * @returns {UseMutationResult<TaskResponseDto, Error, EditTaskPayload>} The mutation result
 * containing the status and methods to execute the mutation.
 */
export function useEditTask(): UseMutationResult<TaskResponseDto, Error, EditTaskPayload> {
  const queryClient = useQueryClient();
  const { editTask } = appContainer.usecases.tasks;

  return useMutation({
    mutationFn: (payload) => editTask(payload),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(QUERY_KEYS.task(updatedTask.id), updatedTask);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taskDetails(updatedTask.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(updatedTask.id) });
      toast.success("Task updated successfully");
    },
    onError: () => toast.error("Failed to edit task"),
  });
}
