import { Task } from "@/domain/task/task.entity";
import styles from "./TaskList.module.css";
import TaskItem from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  return (
    <div className={styles.taskContainer}>
      {tasks?.map((task) => (
        <TaskItem key={task.id} task={task} onClick={() => console.log("Task clicked:", task.id)} />
      ))}
    </div>
  );
}
