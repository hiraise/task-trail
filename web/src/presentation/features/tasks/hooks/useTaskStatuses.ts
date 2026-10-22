import { useQuery } from "@tanstack/react-query";

import type { TaskStatus } from "@/domain/models/TaskStatus";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** Статусы задач — один набор на все проекты (ADR-0003), в порядке работы над задачей. */
export function useTaskStatuses() {
  return useQuery<TaskStatus[], Error>({
    queryKey: QUERY_KEYS.task.statuses,
    queryFn: () => taskRepository.findStatuses(),
    // Набор фиксирован: пока открыт веб, он не меняется
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
