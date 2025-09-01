import { toast } from "sonner";

import styles from "./TaskInfo.module.css";

import { Task } from "@/domain/task/task.entity";
import { TaskDependenciesItem } from "./TaskDependenciesItem";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { TaskStatus } from "./TaskStatus";
import { TaskTitle } from "./TaskTitle";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { useGetTaskInfo } from "@/application/tasks/hooks/useTasks";

export function TaskInfo({ task }: { task: Task }) {
  const { showChangeStatus, showSelectAssignee, showSelectProject } = useGlobalModals();
  const { status, projectId, assignee, project } = useGetTaskInfo(task.id);

  const handleProjectSelect = async () => {
    const result = await showSelectProject(task.projectId);
    if (!result) return;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success(`Select project with id: ${result.id}`);
  };

  const handleAssigneeSelect = async () => {
    const result = await showSelectAssignee(task.assigneeId);
    if (!result) return;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success(`Select assignee with id: ${task.assigneeId}`);
  };

  const handleChangeStatus = async () => {
    const result = await showChangeStatus({ currentStatus: status, projectId: projectId });
    if (!result) return;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success(`Change status with: ${result.name}`);
  };

  return (
    <div className={styles.taskInfo}>
      <div className={styles.titleWrapper}>
        <div>
          <TaskStatus status={status} onClick={handleChangeStatus} />
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
