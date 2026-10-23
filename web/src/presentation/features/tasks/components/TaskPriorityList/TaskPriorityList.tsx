import { TASK_PRIORITY_ORDER } from "@/domain/models/TaskPriority";
import type { TaskPriorityId } from "@/domain/types";
import { PriorityIcon, RadioButton } from "@/presentation/shared";
import { tasksTexts } from "@/shared/locales/tasks";

import styles from "./TaskPriorityList.module.css";

interface TaskPriorityListProps {
  selectedId?: TaskPriorityId;
  onSelect: (priority: TaskPriorityId) => void;
}

/** The fixed priorities from the most urgent, each with its icon (ADR-0033). */
export function TaskPriorityList({ selectedId, onSelect }: TaskPriorityListProps) {
  return (
    <div className={styles.list} role="radiogroup">
      {TASK_PRIORITY_ORDER.map((priority) => (
        <RadioButton
          key={priority}
          name="taskPriority"
          option={{ value: priority, label: tasksTexts.priorities[priority] }}
          icon={<PriorityIcon priority={priority} size="24px" />}
          checked={selectedId === priority}
          onChange={() => onSelect(priority)}
        />
      ))}
    </div>
  );
}
