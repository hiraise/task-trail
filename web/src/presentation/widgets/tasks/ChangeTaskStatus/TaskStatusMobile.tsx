import styles from "./TaskStatusDesktop.module.css";

import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { useGetProjectStatuses } from "@/application/projects/hooks/useProject";
import { ChangeStatusProps } from "@/shared/hooks/useGlobalModals";
import { StatusOption, TaskStatusProps } from "./TaskStatus.types";
import { RadioButton } from "@/presentation/ui/RadioButton";

export function TaskStatusMobile({ onSelect, selectedStatus }: TaskStatusProps) {
  const { projectId } = useGlobalModalProps<ChangeStatusProps>() ?? {};
  const { data: statuses } = useGetProjectStatuses(projectId!);

  return (
    <div className={styles.statusContainer}>
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
