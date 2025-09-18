import styles from "./TaskInfo.module.css";

import { Task } from "@/domain/task/task.entity";
import { TaskDependenciesItem } from "./TaskDependenciesItem";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { TaskStatus } from "./TaskStatus";
import { TaskTitle } from "./TaskTitle";
import { useChangeTaskInfo } from "@/application/tasks/hooks/useChangeTaskInfo";

export function TaskInfo({ task }: { task: Task }) {
  const { status, assignee, project, changeStatus, selectProject, selectAssignee } =
    useChangeTaskInfo(task);

  return (
    <div className={styles.taskInfo}>
      <div className={styles.titleWrapper}>
        <div>
          <TaskStatus status={status} onClick={changeStatus} />
        </div>
        <TaskTitle task={task} />
      </div>
      <div className={styles.taskDependencies}>
        <TaskDependenciesItem onClick={selectProject}>
          <Icon as={ICONS.project} size="18px" />
          <span>{project}</span>
        </TaskDependenciesItem>
        <TaskDependenciesItem onClick={selectAssignee}>
          <Icon as={ICONS.profile} size="18px" />
          <span>{assignee}</span>
        </TaskDependenciesItem>
      </div>
    </div>
  );
}
