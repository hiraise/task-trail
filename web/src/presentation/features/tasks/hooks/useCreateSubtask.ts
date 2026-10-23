import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateTaskPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import type { TaskId } from "@/domain/types";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";

import { invalidateParent, invalidateTaskLists } from "./taskCache";

export type CreateSubtaskPayload = CreateTaskPayload & { parentId: TaskId };

/**
 * Creates a subtask from the parent's subtasks block (ADR-0036). Unlike `useCreateTask` it stays
 * on the parent: the block keeps its field open for the next one.
 */
export function useCreateSubtask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, CreateSubtaskPayload>({
    mutationFn: (payload) => taskRepository.create(payload),
    onSuccess: (task, { parentId }) => {
      queryClient.setQueryData(QUERY_KEYS.task.detail(task.id), task);
      invalidateParent(queryClient, parentId);
      invalidateTaskLists(queryClient, task.projectId, { countChanged: true });
    },
    onError: (error) => toastError(error, tasksTexts.createSubtaskFailed),
  });
}
