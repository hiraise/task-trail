"use client";

import { useRouter } from "next/navigation";

import { Task } from "@/domain/task/task.entity";
import styles from "./TaskList.module.css";
import TaskItem from "./TaskItem";
import { ROUTES } from "@/infrastructure/config/routes";

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  const router = useRouter();
  return (
    <div className={styles.taskContainer}>
      {tasks?.map((task) => (
        <TaskItem key={task.id} task={task} onClick={() => router.push(ROUTES.task(task.id))} />
      ))}
    </div>
  );
}
