import type { TaskStatusId } from "@/domain/types";
import { RadioButton } from "@/presentation/shared";

import { useTaskStatuses } from "../../hooks";

import styles from "./TaskStatusList.module.css";

interface TaskStatusListProps {
  selectedId?: TaskStatusId;
  onSelect: (statusId: TaskStatusId) => void;
}

/** Статусы задачи из общего набора (GET /v1/task-statuses) в порядке работы над задачей. */
export function TaskStatusList({ selectedId, onSelect }: TaskStatusListProps) {
  const { data: statuses = [] } = useTaskStatuses();

  return (
    <div className={styles.list} role="radiogroup">
      {statuses.map((status) => (
        <RadioButton
          key={status.id}
          name="taskStatus"
          option={{ value: status.id, label: status.name }}
          checked={selectedId === status.id}
          onChange={() => onSelect(status.id)}
        />
      ))}
    </div>
  );
}
