import styles from "./TaskList.module.css";

import { toast } from "sonner";
import { TaskItem } from "./TaskItem";
import { tasks as mockTasks, Task } from "./TaskList.mock";

interface TaskListProps {
  availableTasks?: Task[];
}

export function TaskList({ availableTasks }: TaskListProps) {
  const tasks = availableTasks || mockTasks;

  const handleOnClick = (id: number) => {
    toast.info(`Task with ID ${id} clicked`);
  };

  return (
    <div className={styles.container}>
      {tasks.map((task) => {
        return (
          <div
            key={task.title}
            className={styles.userWrapper}
            onClick={() => handleOnClick(task.id)}
          >
            <TaskItem title={task.title} />
          </div>
        );
      })}
    </div>
  );
}
