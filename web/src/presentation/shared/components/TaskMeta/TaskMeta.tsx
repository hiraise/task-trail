import clsx from "clsx";
import type { ReactNode } from "react";

import type { Task } from "@/domain/models/Task";
import { ICONS } from "@/shared/config/icons";
import { formatDueDate, isOverdue } from "@/shared/utils/dueDate";

import { useTaskStatuses } from "@/presentation/shared/hooks";
import { Icon } from "../../ui";
import { LabelChip } from "../LabelChip";
import { PriorityIcon } from "../PriorityIcon";

import styles from "./TaskMeta.module.css";

const MAX_CARD_LABELS = 3;

/**
 * The badges under a task name in every card (artboard A of stage 3): priority, due date, at most
 * subtasks "done/total", MAX_CARD_LABELS labels and "+N". Nothing to show — renders nothing.
 */
export function TaskMeta({ task, className }: { task: Task; className?: string }) {
  const { data: statuses } = useTaskStatuses();
  const items: ReactNode[] = [];

  if (task.priority !== "normal") {
    items.push(<PriorityIcon key="priority" priority={task.priority} size="16px" />);
  }
  if (task.dueDate) {
    const resolved = statuses?.find((s) => s.id === task.statusId)?.isResolved ?? false;

    items.push(
      <span key="dueDate" className={clsx(styles.item, isOverdue(task.dueDate, resolved) && styles.overdue)}>
        <Icon as={ICONS.calendar} size="16px" inheritColor aria-hidden />
        {formatDueDate(task.dueDate)}
      </span>,
    );
  }
  if (task.subtasksTotal > 0) {
    items.push(
      <span key="subtasks" className={styles.item}>
        <Icon as={ICONS.subtasks} size="16px" inheritColor aria-hidden />
        {`${task.subtasksDone}/${task.subtasksTotal}`}
      </span>,
    );
  }
  task.labels.slice(0, MAX_CARD_LABELS).forEach((label) => {
    items.push(<LabelChip key={label.id} label={label} />);
  });
  if (task.labels.length > MAX_CARD_LABELS) {
    items.push(<span key="moreLabels">+{task.labels.length - MAX_CARD_LABELS}</span>);
  }
  if (items.length === 0) return null;

  // A span: the line sits inside the span.text of ProjectTask and the "My tasks" card
  return <span className={clsx("caption-reg", styles.meta, className)}>{items}</span>;
}
