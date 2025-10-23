import Link from "next/link";

import styles from "./TaskList.module.css";

import { Task } from "@/domain/task/task.entity";
import { ROUTES } from "@/infrastructure/config/routes";
import { ProjectTask } from "./ProjectTask";

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul role="list" className={styles.list}>
      {tasks.map((task) => (
        <li key={task.id}>
          <Link href={ROUTES.projectTask(task.projectId, task.id)}>
            <ProjectTask title={task.title} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
