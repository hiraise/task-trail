import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { MoveTaskPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";
import { interpolate } from "@/shared/utils/interpolate";

import { invalidateTaskLists, storeTask } from "./taskCache";

/**
 * Переносит задачу в другой проект. Статус сохраняется; исполнитель, который не участник нового
 * проекта, снимается сервером — об этом говорит тост.
 */
export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, MoveTaskPayload>({
    mutationFn: ({ task, project }) => taskRepository.move(task.id, project.id),
    onSuccess: (moved, { task, project }) => {
      storeTask(queryClient, moved);
      invalidateTaskLists(queryClient, task.projectId, { countChanged: true });
      invalidateTaskLists(queryClient, moved.projectId, { countChanged: true });

      // Снятого ответственного легко не заметить — об этом предупреждение, а не обычный тост
      if (task.assigneeId && !moved.assigneeId) {
        toast.warning(interpolate(tasksTexts.taskMovedUnassigned, { project: project.name }));
      } else {
        toast.success(interpolate(tasksTexts.taskMoved, { project: project.name }));
      }
    },
    onError: (error) => toastError(error, tasksTexts.moveTaskFailed),
  });
}
