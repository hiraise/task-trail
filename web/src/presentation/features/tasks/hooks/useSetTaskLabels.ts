import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { SetTaskLabelsPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";

import { storeTask } from "./taskCache";

/** Replaces the task's labels (ADR-0035); the cards and the page show them after the server responds. */
export function useSetTaskLabels() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, SetTaskLabelsPayload>({
    mutationFn: ({ taskId, labelIds }) => taskRepository.setLabels(taskId, labelIds),
    onSuccess: (task) => storeTask(queryClient, task),
    onError: (error) => toastError(error, tasksTexts.setLabelsFailed),
  });
}
