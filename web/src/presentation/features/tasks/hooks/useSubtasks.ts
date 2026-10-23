import { useQuery } from "@tanstack/react-query";

import type { Task } from "@/domain/models/Task";
import type { TaskId } from "@/domain/types";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** The task's subtasks in number order, archived ones included (ADR-0036). */
export function useSubtasks(taskId: TaskId, { enabled = true } = {}) {
  return useQuery<Task[], Error>({
    queryKey: QUERY_KEYS.task.subtasks(taskId),
    queryFn: () => taskRepository.findSubtasks(taskId),
    enabled: enabled && !!taskId,
  });
}
