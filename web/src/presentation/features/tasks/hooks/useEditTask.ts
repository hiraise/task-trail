import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { EditTaskPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";

import { storeTask } from "./taskCache";

/** Меняет название или описание; сервер отвечает изменённой задачей (ADR-0018). */
export function useEditTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, EditTaskPayload>({
    mutationFn: ({ taskId, ...changes }) => taskRepository.update(taskId, changes),
    onSuccess: (task) => {
      storeTask(queryClient, task);
      toast.success(tasksTexts.taskUpdated);
    },
    onError: (error) => toastError(error, tasksTexts.updateTaskFailed),
  });
}
