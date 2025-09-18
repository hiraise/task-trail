import styles from "./TaskStatusDesktop.module.css";

import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { useGetProjectStatuses } from "@/application/projects/hooks/useProject";
import { ChangeStatusProps } from "@/shared/hooks/useGlobalModals";
import { StatusOption, TaskStatusProps } from "./TaskStatus.types";
import { RadioButton } from "@/presentation/ui/RadioButton";
import { SubmitButton } from "../../auth/_components";
import { TEXTS } from "@/shared/locales/texts";

export function TaskStatusDesktop({ onSelect, onApply, onClose, selectedStatus }: TaskStatusProps) {
  const { projectId } = useGlobalModalProps<ChangeStatusProps>() ?? {};
  const { data: statuses } = useGetProjectStatuses(projectId!);

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
      <div className={styles.buttons}>
        <SubmitButton $variant="secondary" onClick={onClose}>
          {TEXTS.cancel}
        </SubmitButton>
        <SubmitButton $variant="primary" onClick={onApply}>
          {TEXTS.apply}
        </SubmitButton>
      </div>
    </div>
  );
}
