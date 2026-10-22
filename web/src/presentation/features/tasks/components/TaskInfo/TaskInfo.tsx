import clsx from "clsx";

import type { ProjectDetails } from "@/domain/models/Project";
import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { Task } from "@/domain/models/Task";
import type { TaskStatus } from "@/domain/models/TaskStatus";
import { getUserDisplayName } from "@/domain/models/User";
import { DropdownMenu, IconButton } from "@/presentation/shared";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { tasksTexts } from "@/shared/locales/tasks";

import { useTaskActions } from "../../hooks";
import { TaskStatusBadge } from "../TaskStatusBadge";

import { TaskField } from "./TaskField";
import styles from "./TaskInfo.module.css";

interface TaskInfoProps {
  task: Task;
  project: ProjectDetails;
  status?: TaskStatus;
  assignee?: ProjectMember;
  /** The "…" menu next to the name — from 768 px; on a phone the page top bar opens the menu */
  menuItems: MenuItem[];
}

/** Task: status, name, description, assignee and project — each is changed in its own modal. */
export function TaskInfo({ task, project, status, assignee, menuItems }: TaskInfoProps) {
  const { changeStatus, selectAssignee, selectProject } = useTaskActions(task);

  return (
    <div className={styles.info}>
      <div className={styles.header}>
        <div className={styles.heading}>
          <TaskStatusBadge status={status} onClick={changeStatus} />
          <h2 className={styles.name}>{task.name}</h2>
          {task.description && (
            <p className={clsx("body-reg-2", styles.description)}>{task.description}</p>
          )}
        </div>
        {menuItems.length > 0 && (
          <div className={styles.menu}>
            <DropdownMenu
              trigger={<IconButton icon={ICONS.menuHorizontal} size="24px" />}
              items={menuItems}
            />
          </div>
        )}
      </div>
      <div className={styles.fields}>
        <TaskField
          icon={ICONS.profile}
          label={tasksTexts.assignee}
          value={assignee && getUserDisplayName(assignee)}
          placeholder={tasksTexts.noAssignee}
          onClick={selectAssignee}
        />
        <TaskField
          icon={ICONS.project}
          label={tasksTexts.project}
          value={project.name}
          placeholder={tasksTexts.project}
          onClick={selectProject}
        />
      </div>
    </div>
  );
}
