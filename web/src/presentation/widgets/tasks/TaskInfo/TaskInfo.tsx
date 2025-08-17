import styles from "./TaskInfo.module.css";

import { Task } from "@/domain/task/task.entity";
import { TaskDependenciesItem } from "./TaskDependenciesItem";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { TaskStatus } from "./TaskStatus";
import { TaskTitle } from "./TaskTitle";
import { useTaskModals } from "@/application/tasks/hooks/useTaskModals";

export function TaskInfo({ task }: { task: Task }) {
  const { showChangeSatus } = useTaskModals();

  const handleProjectSelect = () => {
    console.log("Project selected");
  };

  const handleAssigneeSelect = () => {
    console.log("Assignee selected");
  };

  return (
    <div className={styles.taskInfo}>
      <div className={styles.titleWrapper}>
        <div>
          <TaskStatus status={task.status} onClick={showChangeSatus} />
        </div>
        <TaskTitle task={task} />
      </div>
      <div className={styles.taskDependencies}>
        <TaskDependenciesItem onClick={handleProjectSelect}>
          <Icon as={ICONS.project} size="18px" />
          <span>Название какого-то проекта</span>
        </TaskDependenciesItem>
        <TaskDependenciesItem onClick={handleAssigneeSelect}>
          <Icon as={ICONS.profile} size="18px" />
          <span>Имя какого-то исполнителя</span>
        </TaskDependenciesItem>
      </div>
    </div>
  );
}
