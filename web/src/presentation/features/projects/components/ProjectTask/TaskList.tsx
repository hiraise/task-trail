import { Link } from "@tanstack/react-router";

import type { Task } from "@/domain/models/Task";

import { ProjectTask } from "./ProjectTask";
import styles from "./TaskList.module.css";

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul role="list" className={styles.list}>
      {tasks.map((task) => (
        <li key={task.id}>
          {/* <Link to={ROUTES.projectTask(task.projectId, task.id)}> */}
          <Link to={"/projects/$id/tasks/$taskId"} params={{ id: task.projectId, taskId: task.id }}>
            <ProjectTask title={task.name} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
