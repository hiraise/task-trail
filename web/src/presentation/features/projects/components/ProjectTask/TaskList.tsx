import { Link } from "@tanstack/react-router";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { Task } from "@/domain/models/Task";

import { ProjectTask } from "./ProjectTask";
import styles from "./TaskList.module.css";

interface TaskListProps {
  tasks: Task[];
  /** Участники проекта: из них — ответственные задач */
  members: ProjectMember[];
}

export function TaskList({ tasks, members }: TaskListProps) {
  return (
    <ul role="list" className={styles.list}>
      {tasks.map((task) => (
        <li key={task.id}>
          <Link to="/projects/$id/tasks/$taskId" params={{ id: task.projectId, taskId: task.id }}>
            <ProjectTask
              title={task.name}
              assignee={members.find((member) => member.id === task.assigneeId)}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
