import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Task } from "@/domain/models/Task";
import type { TaskId } from "@/domain/types";
import { taskRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";

import { invalidateTaskLists, storeTask } from "./taskCache";

interface SetTaskArchivedPayload {
  taskId: TaskId;
  archived: boolean;
}

/** Archives or restores a task (ADR-0027); the task moves between the Active and Archived tabs. */
export function useSetTaskArchived() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, SetTaskArchivedPayload>({
    mutationFn: ({ taskId, archived }) => taskRepository.setArchived(taskId, archived),
    onSuccess: (task, { archived }) => {
      storeTask(queryClient, task);
      invalidateTaskLists(queryClient, task.projectId, { countChanged: true });
      toast.success(archived ? tasksTexts.taskArchived : tasksTexts.taskRestored);
    },
    onError: (error, { archived }) =>
      toastError(error, archived ? tasksTexts.archiveTaskFailed : tasksTexts.restoreTaskFailed),
  });
}
