import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";

import { invalidateTaskLists } from "./taskCache";

/** Soft-deletes the task and leaves the task page: to "My tasks" or to its project. */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return useMutation<void, Error, Task>({
    mutationFn: (task) => taskRepository.delete(task.id),
    onSuccess: async (_, task) => {
      toast.success(tasksTexts.taskDeleted);

      // Leave the task page first, otherwise it refetches the deleted task
      if (pathname.startsWith(ROUTES.tasks)) {
        await navigate({ to: ROUTES.tasks, replace: true });
      } else {
        await navigate({ to: "/projects/$id", params: { id: task.projectId }, replace: true });
      }

      queryClient.removeQueries({ queryKey: QUERY_KEYS.task.detail(task.id) });
      invalidateTaskLists(queryClient, task.projectId, { countChanged: true });
    },
    onError: (error) => toastError(error, tasksTexts.deleteTaskFailed),
  });
}
