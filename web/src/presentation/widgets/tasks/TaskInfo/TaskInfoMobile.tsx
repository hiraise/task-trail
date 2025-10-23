import styles from "./TaskInfoMobile.module.css";

import { Task } from "@/domain/task/task.entity";
import { TaskStatus } from "./TaskStatus";
import { TaskDetailsMobile } from "./TaskDetailsMobile";
import { useChangeTaskInfo } from "@/application/tasks/hooks/useChangeTaskInfo";
import { ICONS } from "@/infrastructure/config/icons";
import { TEXTS } from "@/shared/locales/texts";

export function TaskInfoMobile({ task }: { task: Task }) {
  const { status, assignee, project, changeStatus, selectProject, selectAssignee } =
    useChangeTaskInfo(task);

  return (
    <div className={styles.taskInfo}>
      <div className={styles.layout}>
        <TaskStatus status={status} onClick={changeStatus} />
        <h2 className="multiline">{task.title}</h2>
        <p className="body-reg-2">{task.description}</p>
      </div>
      <div className={styles.layout}>
        <TaskDetailsMobile
          icon={ICONS.profile}
          label={assignee}
          onClick={selectAssignee}
          placeholder={TEXTS.tasks.assignee}
        />
        <TaskDetailsMobile
          icon={ICONS.project}
          label={project}
          onClick={selectProject}
          placeholder={TEXTS.tasks.project}
        />
      </div>
    </div>
  );
}
