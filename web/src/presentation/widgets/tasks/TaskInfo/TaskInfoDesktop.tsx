import styles from "./TaskInfoDesktop.module.css";

import { Task } from "@/domain/task/task.entity";
import { TaskStatus } from "./TaskStatus";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { TEXTS } from "@/shared/locales/texts";
import { TaskDetailsDesktop } from "./TaskDetailsDesktop";
import { useChangeTaskInfo } from "@/application/tasks/hooks/useChangeTaskInfo";
import { DropdownMenu } from "../../common/DropdownMenu";
import { useTaskMenuItems } from "@/application/tasks/hooks/useTaskMenuItems";

export function TaskInfoDesktop({ task }: { task: Task }) {
  const { status, assignee, project, changeStatus, selectProject, selectAssignee } =
    useChangeTaskInfo(task);
  const { menuItems } = useTaskMenuItems(task);

  return (
    <div className={styles.container}>
      <div className={styles.titleWapper}>
        <div className={styles.title}>
          <TaskStatus status={status} onClick={changeStatus} />
          <h2>{task.title}</h2>
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
          text={assignee ?? ""}
          onClick={selectAssignee}
        />
        <TaskDetailsDesktop
          icon={ICONS.project}
          label={TEXTS.tasks.project}
          text={project}
          onClick={selectProject}
        />
      </div>
    </div>
  );
}
