import { toast } from "sonner";

import styles from "./TaskInfoDesktop.module.css";

import { Task } from "@/domain/task/task.entity";
import { useGetTaskInfo } from "@/application/tasks/hooks/useTasks";
import { TaskStatus } from "./TaskStatus";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { TEXTS } from "@/shared/locales/texts";
import { TaskDetailsDesktop } from "./TaskDetailsDesktop";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";

export function TaskInfoDesktop({ task }: { task: Task }) {
  const { showChangeStatus, showSelectAssignee, showSelectProject } = useGlobalModals();
  const { status, projectId, assignee, project } = useGetTaskInfo(task.id);

  const handleChangeStatus = async () => {
    const result = await showChangeStatus({ currentStatus: status, projectId: projectId });
    if (!result) return;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success(`Change status with: ${result.name}`);
  };

  const handleSelectProject = async () => {
    const result = await showSelectProject(task.projectId);
    if (!result) return;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success(`Select project with id: ${result.id}`);
  };

  const handleSelectAssignee = async () => {
    const result = await showSelectAssignee({
      userId: task.assigneeId,
      projectId: task.projectId,
    });
    if (!result) return;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success(`Select assignee with id: ${task.assigneeId}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleWapper}>
        <div className={styles.title}>
          <div>
            <TaskStatus status={status} onClick={handleChangeStatus} />
          </div>
          <h2>{task.title}</h2>
          <span className="body-reg-2">{task.description}</span>
        </div>
        <IconButton icon={ICONS.menuHorizontal} size="24px" />
      </div>
      <div className={styles.taskDetails}>
        <TaskDetailsDesktop
          icon={ICONS.profile}
          label={TEXTS.tasks.assignee}
          text={assignee ?? ""}
          onClick={handleSelectAssignee}
        />
        <TaskDetailsDesktop
          icon={ICONS.project}
          label={TEXTS.tasks.project}
          text={project}
          onClick={handleSelectProject}
        />
      </div>
    </div>
  );
}
