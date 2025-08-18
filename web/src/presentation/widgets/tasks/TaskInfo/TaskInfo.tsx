import styles from "./TaskInfo.module.css";

import { Task } from "@/domain/task/task.entity";
import { TaskDependenciesItem } from "./TaskDependenciesItem";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { TaskStatus } from "./TaskStatus";
import { TaskTitle } from "./TaskTitle";
import { useTaskModals } from "@/application/tasks/hooks/useTaskModals";
import { useAppSelector } from "@/infrastructure/redux/hooks";
import { selectAssignee, selectProject } from "@/application/tasks/slices/taskSelectors";

export function TaskInfo({ task }: { task: Task }) {
  const { showChangeSatus, showSelectAssignee, showSelectProject } = useTaskModals();
  const assignee = useAppSelector(selectAssignee);
  const project = useAppSelector(selectProject);

  const handleProjectSelect = async () => {
    await showSelectProject(task.projectId);
  };

  const handleAssigneeSelect = async () => {
    await showSelectAssignee(task.assigneeId);
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
          <span>{project}</span>
        </TaskDependenciesItem>
        <TaskDependenciesItem onClick={handleAssigneeSelect}>
          <Icon as={ICONS.profile} size="18px" />
          <span>{assignee}</span>
        </TaskDependenciesItem>
      </div>
    </div>
  );
}
