import type { QueryClient } from "@tanstack/react-query";

import type { Task } from "@/domain/models/Task";
import type { ProjectId, TaskId } from "@/domain/types";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

// The server answers a task change with the task itself (ADR-0018): it goes into the cache as is,
// and the lists containing it are refetched — the server decides list order and contents.

/** Project task lists and "My tasks"; `countChanged` — also the task count on project cards. */
export function invalidateTaskLists(
  queryClient: QueryClient,
  projectId: ProjectId,
  { countChanged = false } = {},
): void {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.tasks(projectId) });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.mine });

  if (countChanged) {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.detail(projectId), exact: true });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.all });
  }
}

/** The task changed: the task page shows the server response, lists containing it are refetched. */
export function storeTask(queryClient: QueryClient, task: Task): void {
  queryClient.setQueryData(QUERY_KEYS.task.detail(task.id), task);
  invalidateTaskLists(queryClient, task.projectId);
}

/** The task from already loaded lists: project tasks or "My tasks". */
export function findTaskInLists(queryClient: QueryClient, taskId: TaskId): Task | undefined {
  const lists = queryClient.getQueriesData<Task[]>({
    predicate: ({ queryKey: [entity, id, sub] }) =>
      (entity === "project" && sub === "tasks") || (entity === "task" && id === "mine"),
  });

  for (const [, tasks] of lists) {
    const task = tasks?.find((item) => item.id === taskId);

    if (task) return task;
  }

  return undefined;
}
