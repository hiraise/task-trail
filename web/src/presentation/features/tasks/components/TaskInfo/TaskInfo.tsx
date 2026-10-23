import { Link } from "@tanstack/react-router";
import clsx from "clsx";

import type { Label } from "@/domain/models/Label";
import type { ProjectDetails } from "@/domain/models/Project";
import type { ProjectMember } from "@/domain/models/ProjectMember";
import { isTaskArchived, type Task } from "@/domain/models/Task";
import type { TaskStatus } from "@/domain/models/TaskStatus";
import { getUserDisplayName } from "@/domain/models/User";
import { ArchiveTag, DropdownMenu, IconButton, LabelChip, PriorityIcon } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { tasksTexts } from "@/shared/locales/tasks";
import { formatDueDate, isOverdue } from "@/shared/utils/dueDate";

import { useTask, useTaskActions } from "../../hooks";
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

interface DueDateFieldProps {
  dueDate?: string;
  resolved: boolean;
  onClick?: () => void;
}

/** The due date row: today, tomorrow or the day; overdue — in --text-critical (ADR-0034). */
function DueDateField({ dueDate, resolved, onClick }: DueDateFieldProps) {
  return (
    <TaskField
      icon={ICONS.calendar}
      label={tasksTexts.dueDate}
      value={dueDate && formatDueDate(dueDate)}
      placeholder={tasksTexts.noDueDate}
      tone={isOverdue(dueDate, resolved) ? "critical" : undefined}
      onClick={onClick}
    />
  );
}

/** The labels row: chips of the task's labels, the "Add" placeholder when there are none (ADR-0035). */
function LabelsField({ labels, onClick }: { labels: Label[]; onClick?: () => void }) {
  return (
    <TaskField
      icon={ICONS.label}
      label={tasksTexts.labels}
      placeholder={tasksTexts.addLabels}
      ariaValue={labels.map((label) => label.name).join(", ")}
      onClick={onClick}
    >
      {labels.length > 0 && labels.map((label) => <LabelChip key={label.id} label={label} />)}
    </TaskField>
  );
}

/**
 * "Subtask DS-12 · Name" above the key of a subtask (ADR-0036); while the parent loads — only
 * "Subtask". The hook runs for every task: hooks cannot be conditional, an empty ID disables it.
 */
function ParentLink({ parentId }: { parentId?: Task["parentId"] }) {
  const { data: parent } = useTask(parentId ?? "");
  const { closeAllModals } = useGlobalModals();

  if (!parentId) return null;

  return (
    // Inside the kanban TaskModal: close it, or it stays open over the parent page
    <Link
      to="/tasks/$taskId"
      params={{ taskId: parentId }}
      className={clsx("caption-reg", styles.parent)}
      onClick={() => closeAllModals()}
    >
      {parent ? `${tasksTexts.subtaskOf} ${parent.key} · ${parent.name}` : tasksTexts.subtaskOf}
    </Link>
  );
}

/**
 * Task: status, key above the name, name, description and the fields (assignee, project, priority,
 * due date, labels) — each is changed in its own modal. An archived task is read-only: the archive tag
 * instead of the status, fields are not clickable (ADR-0027).
 */
export function TaskInfo({ task, project, status, assignee, menuItems }: TaskInfoProps) {
  const { changeStatus, changePriority, changeDueDate, selectAssignee, selectLabels, selectProject } =
    useTaskActions(task);
  const archived = isTaskArchived(task);
  // An archived task is read-only: its fields get no handler
  const whenActive = (action: () => void) => (archived ? undefined : action);

  return (
    <div className={styles.info}>
      <div className={styles.header}>
        <div className={styles.heading}>
          {archived ? <ArchiveTag /> : <TaskStatusBadge status={status} onClick={changeStatus} />}
          <div className={styles.title}>
            <ParentLink parentId={task.parentId} />
            <span className={clsx("caption-reg", styles.key)}>{task.key}</span>
            <h2 className={styles.name}>{task.name}</h2>
          </div>
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
          onClick={whenActive(selectAssignee)}
        />
        <TaskField
          icon={ICONS.project}
          label={tasksTexts.project}
          value={project.name}
          placeholder={tasksTexts.project}
          onClick={whenActive(selectProject)}
        />
        <TaskField
          iconNode={<PriorityIcon priority={task.priority} size="24px" />}
          label={tasksTexts.priority}
          value={tasksTexts.priorities[task.priority]}
          placeholder={tasksTexts.priority}
          onClick={whenActive(changePriority)}
        />
        <DueDateField
          dueDate={task.dueDate}
          resolved={!!status?.isResolved}
          onClick={whenActive(changeDueDate)}
        />
        <LabelsField labels={task.labels} onClick={whenActive(selectLabels)} />
      </div>
    </div>
  );
}
