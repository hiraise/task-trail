import { Link } from "@tanstack/react-router";

import type { Task } from "@/domain/models/Task";

import TaskItem from "./TaskItem";
import styles from "./TaskListMobile.module.css";

export function TaskListMobile({ tasks }: { tasks: Task[] }) {
  return (
    <div className={styles.taskContainer}>
      {tasks?.map((task) => (
        <Link key={task.id} to={"/tasks/$taskId"} params={{ taskId: task.id }}>
          <TaskItem task={task} />
        </Link>
      ))}
    </div>
  );
}
