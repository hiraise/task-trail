import { useQuery } from "@tanstack/react-query";

import type { Task } from "@/domain/models/Task";
import type { ProjectId } from "@/domain/types";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** Project tasks by their own archive flag (ADR-0027). */
export function useProjectTasks(projectId: ProjectId, archived = false) {
  return useQuery<Task[], Error>({
    queryKey: QUERY_KEYS.project.tasks(projectId, archived),
    queryFn: () => taskRepository.findByProjectId(projectId, archived),
    enabled: !!projectId,
  });
}
