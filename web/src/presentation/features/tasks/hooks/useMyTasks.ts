import { useQuery } from "@tanstack/react-query";

import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** Задачи, назначенные на текущего пользователя, во всех его проектах; новые первыми. */
export function useMyTasks() {
  return useQuery<Task[], Error>({
    queryKey: QUERY_KEYS.task.mine,
    queryFn: () => taskRepository.findAssignedToMe(),
  });
}
