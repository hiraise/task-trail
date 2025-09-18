import Link from "next/link";

import styles from "./TaskList.module.css";

import { TaskItem } from "./TaskItem";
import { Task } from "@/domain/task/task.entity";
import { ROUTES } from "@/infrastructure/config/routes";

interface TaskListProps {
  availableTasks: Task[];
}

export function TaskList({ availableTasks }: TaskListProps) {
  return (
    <div className={styles.container}>
      {availableTasks.map((task) => {
        return (
          <Link key={task.id} href={ROUTES.task(task.id)}>
            <TaskItem task={task} />
          </Link>
        );
      })}
    </div>
  );
}
