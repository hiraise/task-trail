import type { QueryClient } from "@tanstack/react-query";

import type { ProjectId } from "@/domain/types";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * A renamed, recolored or deleted label changes every task that shows it (`Task.labels`, ADR-0035):
 * refresh the project labels and all task caches — task pages, the project lists and boards.
 */
export function invalidateLabelCaches(queryClient: QueryClient, projectId: ProjectId) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.project.labels(projectId),
    }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.all }),
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.project.taskLists(projectId),
    }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.board.prefix }),
  ]);
}
