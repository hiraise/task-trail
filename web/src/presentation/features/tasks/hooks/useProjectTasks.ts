import { useQuery } from "@tanstack/react-query";

import type { Task } from "@/domain/models/Task";
import type { ProjectId } from "@/domain/types";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** Project tasks; newest first. */
export function useProjectTasks(projectId: ProjectId) {
  return useQuery<Task[], Error>({
    queryKey: QUERY_KEYS.project.tasks(projectId),
    queryFn: () => taskRepository.findByProjectId(projectId),
    enabled: !!projectId,
  });
}
