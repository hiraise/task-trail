import { useQuery } from "@tanstack/react-query";

import type { TaskStatus } from "@/domain/models/TaskStatus";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** Task statuses — one set for all projects (ADR-0003), in workflow order. */
export function useTaskStatuses() {
  return useQuery<TaskStatus[], Error>({
    queryKey: QUERY_KEYS.task.statuses,
    queryFn: () => taskRepository.findStatuses(),
    // The set is fixed: it does not change while the web app is open
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
