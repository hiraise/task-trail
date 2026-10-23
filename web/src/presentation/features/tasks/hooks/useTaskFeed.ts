import { useQuery } from "@tanstack/react-query";

import type { TaskComment } from "@/domain/models/TaskComment";
import type { TaskEvent } from "@/domain/models/TaskEvent";
import type { TaskId } from "@/domain/types";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** The task's comments, newest first (ADR-0028). */
export function useTaskComments(taskId: TaskId) {
  return useQuery<TaskComment[], Error>({
    queryKey: QUERY_KEYS.task.comments(taskId),
    queryFn: () => taskRepository.findComments(taskId),
    enabled: !!taskId,
  });
}

/** The task change history, newest first; task changes refetch it (`storeTask`). */
export function useTaskEvents(taskId: TaskId) {
  return useQuery<TaskEvent[], Error>({
    queryKey: QUERY_KEYS.task.events(taskId),
    queryFn: () => taskRepository.findEvents(taskId),
    enabled: !!taskId,
  });
}
