import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ChangeTaskStatusPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";

import { storeTask } from "./taskCache";

/** Changes the status; the new status shows on screen right after the server responds. */
export function useChangeTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, ChangeTaskStatusPayload>({
    mutationFn: ({ taskId, statusId }) => taskRepository.changeStatus(taskId, statusId),
    onSuccess: (task) => storeTask(queryClient, task),
    onError: (error) => toastError(error, tasksTexts.changeStatusFailed),
  });
}
