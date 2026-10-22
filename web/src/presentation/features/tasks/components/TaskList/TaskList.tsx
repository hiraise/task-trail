import { Link } from "@tanstack/react-router";
import clsx from "clsx";

import type { Task } from "@/domain/models/Task";
import { getUserDisplayName, type User } from "@/domain/models/User";
import type { ProjectId } from "@/domain/types";
import { UserAvatar } from "@/presentation/shared";

import styles from "./TaskList.module.css";

interface TaskListProps {
  tasks: Task[];
  /** Названия проектов по ID — строка над названием задачи */
  projectNames: Map<ProjectId, string>;
  /** Ответственный: в «Моих задачах» — текущий пользователь */
  assignee?: User;
}

/**
 * Задачи карточками. Над названием — проект задачи: ключей вида `DS-1` из макета ещё нет
 * (этап 2, docs/roadmap.md), а в макете телефона на этом месте бывает и название проекта.
 */
export function TaskList({ tasks, projectNames, assignee }: TaskListProps) {
  return (
    <ul role="list" className={styles.list}>
      {tasks.map((task) => (
        <li key={task.id}>
          <Link to="/tasks/$taskId" params={{ taskId: task.id }} className={styles.card}>
            <span className={styles.text}>
              <span className={clsx("caption-reg", styles.project)}>
                {projectNames.get(task.projectId)}
              </span>
              <span className={clsx("body-med", styles.name)}>{task.name}</span>
            </span>
            {assignee && (
              <UserAvatar
                variant="small"
                src={assignee.avatarUrl}
                name={getUserDisplayName(assignee)}
              />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
