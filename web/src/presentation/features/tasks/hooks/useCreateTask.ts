import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { CreateTaskPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";

import { invalidateTaskLists } from "./taskCache";

/** Создаёт задачу (статус — по умолчанию, автор — текущий пользователь) и открывает её. */
export function useCreateTask() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<Task, Error, CreateTaskPayload>({
    mutationFn: (payload) => taskRepository.create(payload),
    onSuccess: (task) => {
      queryClient.setQueryData(QUERY_KEYS.task.detail(task.id), task);
      invalidateTaskLists(queryClient, task.projectId, { countChanged: true });
      toast.success(tasksTexts.taskCreated);
      navigate({
        to: "/projects/$id/tasks/$taskId",
        params: { id: task.projectId, taskId: task.id },
      });
    },
    onError: (error) => toastError(error, tasksTexts.createTaskFailed),
  });
}
