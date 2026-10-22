import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ChangeTaskStatusPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";

import { storeTask } from "./taskCache";

/** Меняет статус; новый статус виден на экране сразу после ответа сервера. */
export function useChangeTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, ChangeTaskStatusPayload>({
    mutationFn: ({ taskId, statusId }) => taskRepository.changeStatus(taskId, statusId),
    onSuccess: (task) => storeTask(queryClient, task),
    onError: (error) => toastError(error, tasksTexts.changeStatusFailed),
  });
}
