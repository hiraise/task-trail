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
import { useTask } from "@/application/tasks/hooks/useTask";

export function TaskInfo({ task }: { task: Task }) {
  const { showChangeSatus, showSelectAssignee, showSelectProject } = useTaskModals();
  const { changeAssignee, changeProject, changeStatus } = useTask();
  const assignee = useAppSelector(selectAssignee);
  const project = useAppSelector(selectProject);

  const handleProjectSelect = async () => {
    const result = await showSelectProject(task.projectId);
    if (!result) return;
    await changeProject(result);
  };

  const handleAssigneeSelect = async () => {
    const result = await showSelectAssignee(task.assigneeId);
    if (!result) return;
    await changeAssignee(result);
  };

  const handleChangeStatus = async () => {
    const result = await showChangeSatus();
    if (!result) return;
    await changeStatus(result);
  };

  return (
    <div className={styles.taskInfo}>
      <div className={styles.titleWrapper}>
        <div>
          <TaskStatus status={task.status} onClick={handleChangeStatus} />
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
