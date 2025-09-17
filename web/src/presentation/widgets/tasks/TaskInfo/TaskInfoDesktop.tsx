import styles from "./TaskInfoDesktop.module.css";

import { Task } from "@/domain/task/task.entity";
import { useGetTaskInfo } from "@/application/tasks/hooks/useTasks";
import { TaskStatus } from "./TaskStatus";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { TEXTS } from "@/shared/locales/texts";
import { TaskDetailsDesktop } from "./TaskDetailsDesktop";

export function TaskInfoDesktop({ task }: { task: Task }) {
  const { status, assignee, project } = useGetTaskInfo(task.id);

  const handleChangeStatus = () => {
    console.log("Change status");
  };

  const handleSelectAssignee = () => {
    console.log("Select Assignee");
  };

  const handleSelectProject = () => {
    console.log("Select Project");
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
