import { Link } from "@tanstack/react-router";
import clsx from "clsx";

import type { Task } from "@/domain/models/Task";
import { getUserDisplayName, type User } from "@/domain/models/User";
import type { ProjectId } from "@/domain/types";
import { UserAvatar } from "@/presentation/shared";

import styles from "./TaskList.module.css";

interface TaskListProps {
  tasks: Task[];
  /** Project names by ID — the line above the task name */
  projectNames: Map<ProjectId, string>;
  /** Assignee: in "My tasks" — the current user */
  assignee?: User;
}

/**
 * Tasks as cards. The task's project is above the name: keys like `DS-1` from the mockup do not exist
 * yet (stage 2, docs/roadmap.md), and the phone mockup sometimes shows the project name there too.
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
