import { useProjectStatuses } from "@/presentation/features/projects/hooks";
import { RadioButton } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { ChangeStatusProps } from "@/presentation/shared/hooks/useGlobalModals";

import type { StatusOption, TaskStatusProps } from "./TaskStatus.types";
import styles from "./TaskStatusDesktop.module.css";

export function TaskStatusDesktop({ onSelect, selectedStatus }: TaskStatusProps) {
  const { projectId } = useGlobalModalProps<ChangeStatusProps>() ?? {};
  const { data: statuses } = useProjectStatuses(projectId!);

  return (
    <div className={styles.container}>
      {statuses?.map((status) => (
        <RadioButton<StatusOption>
          key={status.id}
          option={{ value: status.name, label: status.name }}
          checked={selectedStatus?.id === status.id}
          onChange={() => onSelect(status)}
          name="statuses"
        />
      ))}
    </div>
  );
}
