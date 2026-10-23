import { Link } from "@tanstack/react-router";
import clsx from "clsx";

import type { Task } from "@/domain/models/Task";
import { getUserDisplayName, type User } from "@/domain/models/User";
import type { ProjectId } from "@/domain/types";
import { TaskMeta, UserAvatar } from "@/presentation/shared";

import styles from "./TaskList.module.css";

interface TaskListProps {
  tasks: Task[];
  /** Project names by ID — in the line above the task name, after the task key */
  projectNames: Map<ProjectId, string>;
  /** Assignee: in "My tasks" — the current user */
  assignee?: User;
}

/** Tasks as cards; above the name — the task key and its project name: "DS-12 · Design system". */
export function TaskList({ tasks, projectNames, assignee }: TaskListProps) {
  return (
    <ul role="list" className={styles.list}>
      {tasks.map((task) => (
        <li key={task.id}>
          <Link to="/tasks/$taskId" params={{ taskId: task.id }} className={styles.card}>
            <span className={styles.text}>
              <span className={clsx("caption-reg", styles.project)}>
                {[task.key, projectNames.get(task.projectId)].filter(Boolean).join(" · ")}
              </span>
              <span className={clsx("body-med", styles.name)}>{task.name}</span>
              <TaskMeta task={task} />
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
