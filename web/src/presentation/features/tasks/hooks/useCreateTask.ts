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

/**
 * Creates a task (the current user as author) and opens it; `openTask: false` — stays on the page,
 * as on the kanban, where the new card appears in its column.
 */
export function useCreateTask({ openTask = true } = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<Task, Error, CreateTaskPayload>({
    mutationFn: (payload) => taskRepository.create(payload),
    onSuccess: (task) => {
      queryClient.setQueryData(QUERY_KEYS.task.detail(task.id), task);
      invalidateTaskLists(queryClient, task.projectId, { countChanged: true });
      toast.success(tasksTexts.taskCreated);
      if (!openTask) return;
      navigate({
        to: "/projects/$id/tasks/$taskId",
        params: { id: task.projectId, taskId: task.id },
      });
    },
    onError: (error) => toastError(error, tasksTexts.createTaskFailed),
  });
}
