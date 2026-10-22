import { useMemo } from "react";

import type { TaskId } from "@/domain/types";

import { useProject, useProjectMembers } from "../../projects/hooks";

import { useTask } from "./useTask";
import { useTaskStatuses } from "./useTaskStatuses";

/**
 * Страница задачи: задача, её проект с ролью текущего пользователя, статус и исполнитель.
 * Исполнитель — всегда участник проекта (контракт API), поэтому он берётся из участников.
 */
export function useTaskDetail(taskId: TaskId) {
  const taskQuery = useTask(taskId);
  const projectId = taskQuery.data?.projectId;
  const projectQuery = useProject(projectId);
  const membersQuery = useProjectMembers(projectId ?? "");
  const statusesQuery = useTaskStatuses();

  const data = useMemo(() => {
    const task = taskQuery.data;
    const project = projectQuery.data;
    const members = membersQuery.data;
    const statuses = statusesQuery.data;

    if (!task || !project || !members || !statuses) return undefined;

    return {
      task,
      project,
      assignee: members.find((member) => member.id === task.assigneeId),
      status: statuses.find((status) => status.id === task.statusId),
    };
  }, [taskQuery.data, projectQuery.data, membersQuery.data, statusesQuery.data]);

  return {
    data,
    error: taskQuery.error || projectQuery.error || membersQuery.error || statusesQuery.error,
  };
}
