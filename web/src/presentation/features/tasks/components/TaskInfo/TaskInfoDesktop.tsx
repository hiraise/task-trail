import type { Task } from "@/domain/models/Task";
import { useChangeTaskInfo } from "@/presentation/features/tasks/hooks";
import { useTaskMenuItems } from "@/presentation/features/tasks/hooks/useTaskMenuItems";
import { DropdownMenu, IconButton } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { TaskDetailsDesktop } from "./TaskDetailsDesktop";
import styles from "./TaskInfoDesktop.module.css";
import { TaskStatus } from "./TaskStatus";

export function TaskInfoDesktop({ task }: { task: Task }) {
  const { data, changeStatus, selectProject, selectAssignee } = useChangeTaskInfo(task);
  const { menuItems } = useTaskMenuItems(task);

  if (!data) return null;

  return (
    <div className={styles.container}>
      <div className={styles.titleWapper}>
        <div className={styles.title}>
          <TaskStatus status={data.status} onClick={changeStatus} />
          <h2>{task.name}</h2>
          <span className="body-reg-2">{task.description}</span>
        </div>
        <DropdownMenu
          trigger={<IconButton icon={ICONS.menuHorizontal} size="24px" />}
          items={menuItems}
        />
      </div>
      <div className={styles.taskDetails}>
        <TaskDetailsDesktop
          icon={ICONS.profile}
          label={TEXTS.tasks.assignee}
          text={
            (data.assignee && (data.assignee.username || data.assignee.email)) ||
            TEXTS.tasks.assignee
          }
          onClick={selectAssignee}
        />
        <TaskDetailsDesktop
          icon={ICONS.project}
          label={TEXTS.tasks.project}
          text={data.project.name}
          onClick={selectProject}
        />
      </div>
    </div>
  );
}
