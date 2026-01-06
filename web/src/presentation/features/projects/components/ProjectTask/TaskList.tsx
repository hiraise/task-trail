import Link from "next/link";

import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { ROUTES } from "@/shared/config/routes";

import { ProjectTask } from "./ProjectTask";
import styles from "./TaskList.module.css";

export function TaskList({ tasks }: { tasks: TaskResponseDto[] }) {
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
