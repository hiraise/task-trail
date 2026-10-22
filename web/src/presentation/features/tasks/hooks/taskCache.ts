import type { QueryClient } from "@tanstack/react-query";

import type { Task } from "@/domain/models/Task";
import type { ProjectId, TaskId } from "@/domain/types";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

// Изменение задачи сервер возвращает самой задачей (ADR-0018): её кладём в кэш как есть,
// а списки, где она есть, перечитываем — порядок и состав списков решает сервер.

/** Списки задач проекта и «Мои задачи»; `countChanged` — ещё число задач в карточках проекта. */
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

/** Задача изменилась: страница задачи показывает ответ сервера, списки с ней перечитываются. */
export function storeTask(queryClient: QueryClient, task: Task): void {
  queryClient.setQueryData(QUERY_KEYS.task.detail(task.id), task);
  invalidateTaskLists(queryClient, task.projectId);
}

/** Задача из уже загруженных списков: задач проекта или «Моих задач». */
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
