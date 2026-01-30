import Link from "next/link";

import type { Task } from "@/domain/models/Task";
import { ROUTES } from "@/shared/config/routes";

import TaskItem from "./TaskItem";
import styles from "./TaskListMobile.module.css";

export function TaskListMobile({ tasks }: { tasks: Task[] }) {
  return (
    <div className={styles.taskContainer}>
      {tasks?.map((task) => (
        <Link key={task.id} href={ROUTES.task(task.id)}>
          <TaskItem task={task} />
        </Link>
      ))}
    </div>
  );
}
