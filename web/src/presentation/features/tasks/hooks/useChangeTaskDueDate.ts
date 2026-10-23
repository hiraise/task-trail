import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ChangeTaskDueDatePayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";

import { storeTask } from "./taskCache";

/** Changes or removes the due date (ADR-0034); the new value shows on screen right after the server responds. */
export function useChangeTaskDueDate() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, ChangeTaskDueDatePayload>({
    mutationFn: ({ taskId, dueDate }) => taskRepository.changeDueDate(taskId, dueDate),
    onSuccess: (task) => storeTask(queryClient, task),
    onError: (error) => toastError(error, tasksTexts.changeDueDateFailed),
  });
}
