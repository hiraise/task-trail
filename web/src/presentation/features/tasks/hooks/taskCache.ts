import type { QueryClient } from "@tanstack/react-query";

import type { Task } from "@/domain/models/Task";
import type { ProjectId, TaskId } from "@/domain/types";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

// The server answers a task change with the task itself (ADR-0018): it goes into the cache as is,
// and the lists containing it are refetched — the server decides list order and contents.

/**
 * Project task lists, "My tasks" and boards; `countChanged` — also the task count on project cards.
 * Boards are refetched whole: their task lists and counts depend on the task (ADR-0029).
 */
export function invalidateTaskLists(
  queryClient: QueryClient,
  projectId: ProjectId,
  { countChanged = false } = {},
): void {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.taskLists(projectId) });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.mineLists });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.board.prefix });

  if (countChanged) {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.detail(projectId), exact: true });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.lists });
  }
}

/**
 * The task changed: the task page shows the server response, lists containing it are refetched,
 * and so is its history — the change wrote an event (ADR-0028).
 */
export function storeTask(queryClient: QueryClient, task: Task): void {
  queryClient.setQueryData(QUERY_KEYS.task.detail(task.id), task);
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.events(task.id) });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.subtasks(task.id) });
  invalidateTaskLists(queryClient, task.projectId);

  if (task.parentId) invalidateParent(queryClient, task.parentId);
}

/**
 * A subtask changed, appeared or left: the parent's counters and its subtask list are stale (ADR-0036).
 * Only these two keys — the parent's feed did not change.
 */
export function invalidateParent(queryClient: QueryClient, parentId: TaskId): void {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.detail(parentId), exact: true });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.subtasks(parentId) });
}

/**
 * A task left its parent or lost its subtasks on the server (move, delete, ADR-0036): refetch what
 * depends on it. A parent with subtasks detached all of them — every cached task may be stale.
 */
export function invalidateRelatives(queryClient: QueryClient, task: Task): void {
  if (task.parentId) invalidateParent(queryClient, task.parentId);

  if (task.subtasksTotal > 0) queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.all });
}

/** The task from already loaded lists: project tasks, "My tasks", board tasks or subtasks. */
export function findTaskInLists(queryClient: QueryClient, taskId: TaskId): Task | undefined {
  const lists = queryClient.getQueriesData<Task[]>({
    predicate: ({ queryKey: [entity, id, sub] }) =>
      ((entity === "project" || entity === "board") && sub === "tasks") ||
      (entity === "task" && (id === "mine" || sub === "subtasks")),
  });

  for (const [, tasks] of lists) {
    const task = tasks?.find((item) => item.id === taskId);

    if (task) return task;
  }

  return undefined;
}
