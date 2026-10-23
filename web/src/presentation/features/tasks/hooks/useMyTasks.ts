import { useQuery } from "@tanstack/react-query";

import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Tasks assigned to the current user across all their projects. Active: neither the task nor its
 * project is archived; archived: either is (ADR-0027).
 */
export function useMyTasks(archived = false) {
  return useQuery<Task[], Error>({
    queryKey: QUERY_KEYS.task.mine(archived),
    queryFn: () => taskRepository.findAssignedToMe(archived),
  });
}
