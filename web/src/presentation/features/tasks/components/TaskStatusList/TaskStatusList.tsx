import type { TaskStatusId } from "@/domain/types";
import { RadioButton } from "@/presentation/shared";

import { useTaskStatuses } from "../../hooks";

import styles from "./TaskStatusList.module.css";

interface TaskStatusListProps {
  selectedId?: TaskStatusId;
  onSelect: (statusId: TaskStatusId) => void;
}

/** Task statuses from the shared set (GET /v1/task-statuses) in workflow order. */
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
