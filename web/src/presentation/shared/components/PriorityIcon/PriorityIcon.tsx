import type { TaskPriorityId } from "@/domain/types";
import { ICONS } from "@/shared/config/icons";
import { tasksTexts } from "@/shared/locales/tasks";

import { Icon } from "../../ui";

import styles from "./PriorityIcon.module.css";

const PRIORITY_ICONS = {
  urgent: ICONS.priorityUrgent,
  high: ICONS.priorityHigh,
  normal: ICONS.priorityNormal,
  low: ICONS.priorityLow,
} satisfies Record<TaskPriorityId, unknown>;

interface PriorityIconProps {
  priority: TaskPriorityId;
  size?: string;
}

/** The colored icon of a task priority (ADR-0033) with its name as the label. */
export function PriorityIcon({ priority, size }: PriorityIconProps) {
  const name = tasksTexts.priorities[priority];

  // The color is set on the wrapper: a className on Icon would replace its own class
  return (
    <span role="img" aria-label={name} title={name} className={`${styles.priority} ${styles[priority]}`}>
      <Icon as={PRIORITY_ICONS[priority]} size={size} inheritColor aria-hidden />
    </span>
  );
}
