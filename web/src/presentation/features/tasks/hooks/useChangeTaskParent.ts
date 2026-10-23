import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ChangeTaskParentPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import type { TaskId } from "@/domain/types";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";

import { invalidateParent, storeTask } from "./taskCache";

/** Attaches the task to a parent or detaches it (ADR-0036); both parents' counters are refreshed. */
export function useChangeTaskParent() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, ChangeTaskParentPayload, TaskId | undefined>({
    mutationFn: ({ taskId, parentId }) => taskRepository.changeParent(taskId, parentId),
    onMutate: ({ taskId }) =>
      // storeTask refreshes the new parent; the old one is known only before the change
      queryClient.getQueryData<Task>(QUERY_KEYS.task.detail(taskId))?.parentId,
    onSuccess: (task, _, previousParentId) => {
      storeTask(queryClient, task);
      if (previousParentId) invalidateParent(queryClient, previousParentId);
    },
    onError: (error) => toastError(error, tasksTexts.changeParentFailed),
  });
}
