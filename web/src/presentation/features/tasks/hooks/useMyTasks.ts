import { useQuery } from "@tanstack/react-query";

import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** Tasks assigned to the current user across all their projects; newest first. */
export function useMyTasks() {
  return useQuery<Task[], Error>({
    queryKey: QUERY_KEYS.task.mine,
    queryFn: () => taskRepository.findAssignedToMe(),
  });
}
