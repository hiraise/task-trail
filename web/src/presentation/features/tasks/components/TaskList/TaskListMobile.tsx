import Link from "next/link";

import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { ROUTES } from "@/shared/config/routes";

import TaskItem from "./TaskItem";
import styles from "./TaskListMobile.module.css";

interface TaskListProps {
  tasks: TaskResponseDto[];
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
