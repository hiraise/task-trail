import Link from "next/link";

import styles from "./TaskListMobile.module.css";

import TaskItem from "./TaskItem";
import { Task } from "@/domain/task/task.entity";
import { ROUTES } from "@/infrastructure/config/routes";

interface TaskListProps {
  tasks: Task[];
}

export function TaskListMobile({ tasks }: TaskListProps) {
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
