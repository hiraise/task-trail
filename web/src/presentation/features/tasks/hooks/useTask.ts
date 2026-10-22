import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { Task } from "@/domain/models/Task";
import type { TaskId } from "@/domain/types";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

import { findTaskInLists } from "./taskCache";

export function useTask(taskId: TaskId) {
  const queryClient = useQueryClient();

  return useQuery<Task, Error>({
    queryKey: QUERY_KEYS.task.detail(taskId),
    queryFn: () => taskRepository.findById(taskId),
    enabled: !!taskId,
    // While the task loads, show it from the list it was opened from: the project and members
    // start loading at once, without waiting for the task response
    placeholderData: () => findTaskInLists(queryClient, taskId),
  });
}
