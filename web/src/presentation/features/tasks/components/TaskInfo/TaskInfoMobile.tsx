import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { useChangeTaskInfo } from "@/presentation/features/tasks/hooks";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { TaskDetailsMobile } from "./TaskDetailsMobile";
import styles from "./TaskInfoMobile.module.css";
import { TaskStatus } from "./TaskStatus";

export function TaskInfoMobile({ task }: { task: TaskResponseDto }) {
  const { data, changeStatus, selectProject, selectAssignee } = useChangeTaskInfo(task);

  if (!data) return null;

  return (
    <div className={styles.taskInfo}>
      <div className={styles.layout}>
        <TaskStatus status={data.status} onClick={changeStatus} />
        <h2 className="multiline">{task.title}</h2>
        <p className="body-reg-2">{task.description}</p>
      </div>
      <div className={styles.layout}>
        <TaskDetailsMobile
          icon={ICONS.profile}
          label={data.assignee.username || data.assignee.username}
          onClick={selectAssignee}
          placeholder={TEXTS.tasks.assignee}
        />
        <TaskDetailsMobile
          icon={ICONS.project}
          label={data.project.name}
          onClick={selectProject}
          placeholder={TEXTS.tasks.project}
        />
      </div>
    </div>
  );
}
