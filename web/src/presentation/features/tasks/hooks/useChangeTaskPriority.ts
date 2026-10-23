import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ChangeTaskPriorityPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";

import { storeTask } from "./taskCache";

/** Changes the priority (ADR-0033); the new value shows on screen right after the server responds. */
export function useChangeTaskPriority() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, ChangeTaskPriorityPayload>({
    mutationFn: ({ taskId, priority }) => taskRepository.changePriority(taskId, priority),
    onSuccess: (task) => storeTask(queryClient, task),
    onError: (error) => toastError(error, tasksTexts.changePriorityFailed),
  });
}
