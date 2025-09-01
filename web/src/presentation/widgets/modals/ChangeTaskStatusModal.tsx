"use client";

import styles from "./ChangeTaskStatusModal.module.css";

import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { TaskStatus } from "@/domain/task/task.entity";
import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { useGetProjectStatuses } from "@/application/projects/hooks/useProject";
import { ChangeStatusProps } from "@/shared/hooks/useGlobalModals";

interface ChangeTaskStatusProps {
  onChange: (newStatus: TaskStatus) => void;
}

export function ChangeTaskStatus({ onChange }: ChangeTaskStatusProps) {
  const { currentStatus, projectId } = useGlobalModalProps<ChangeStatusProps>() ?? {};
  const { data: statuses } = useGetProjectStatuses(projectId!);

  return (
    <div className={styles.statusContainer}>
      {statuses?.map((status) => (
        <div key={status.id} className={styles.statusWrapper} onClick={() => onChange(status)}>
          {status.name}
          {status.id === currentStatus?.id && (
            <Icon as={ICONS.checkMark} size="14px" inheritColor />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ChangeTaskStatusModal(props: BaseModalProps<TaskStatus>) {
  const handleSelectStatus = (newStatus: TaskStatus) => {
    props.onClose(newStatus);
  };

  return (
    <BaseModal title="Статус задачи" {...props}>
      <ChangeTaskStatus onChange={handleSelectStatus} />
    </BaseModal>
  );
}
