import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { MoveTaskPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";
import { interpolate } from "@/shared/utils/interpolate";

import { invalidateRelatives, invalidateTaskLists, storeTask } from "./taskCache";

/**
 * Moves the task to another project. The status is kept; an assignee who is not a member of the new
 * project is cleared by the server — a toast says so.
 */
export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, MoveTaskPayload>({
    mutationFn: ({ task, project }) => taskRepository.move(task.id, project.id),
    onSuccess: (moved, { task, project }) => {
      storeTask(queryClient, moved);
      invalidateTaskLists(queryClient, task.projectId, { countChanged: true });
      invalidateTaskLists(queryClient, moved.projectId, { countChanged: true });
      // The server detached the task from its parent and its subtasks from it (ADR-0036)
      invalidateRelatives(queryClient, task);

      // A cleared assignee is easy to miss — so this is a warning, not a regular toast
      if (task.assigneeId && !moved.assigneeId) {
        toast.warning(interpolate(tasksTexts.taskMovedUnassigned, { project: project.name }));
      } else {
        toast.success(interpolate(tasksTexts.taskMoved, { project: project.name }));
      }
    },
    onError: (error) => toastError(error, tasksTexts.moveTaskFailed),
  });
}
