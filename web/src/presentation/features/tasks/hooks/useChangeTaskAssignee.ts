import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ChangeTaskAssigneePayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";

import { storeTask } from "./taskCache";

/** Assigns a member of the task's project (otherwise ASSIGNEE_NOT_MEMBER). */
export function useChangeTaskAssignee() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, ChangeTaskAssigneePayload>({
    mutationFn: ({ taskId, assigneeId }) => taskRepository.changeAssignee(taskId, assigneeId),
    onSuccess: (task) => storeTask(queryClient, task),
    onError: (error) => toastError(error, tasksTexts.changeAssigneeFailed),
  });
}
